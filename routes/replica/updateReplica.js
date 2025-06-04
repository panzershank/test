/* ==========================================================================
   Создание и редактирование реплики
   ========================================================================== */

const nodemailer = require("nodemailer")
const config = require("../../config")
const emailReplicaAdd = require("../../emails/replicaAdd")
const emailReplicaChangeStatus = require("../../emails/replicaChangeStatus")
const UsersInProject = require('../../models/users-in-project')
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")
const ReplicaMsg = require("../../models/replica-msg")
const ReplicaFields = require("../../models/replica-fields")
const addSearchContentForReplica = require('../../search/replica')
const statusesList = require('../../utils/statuses')
const addReplicaHistory = require("./utils/addReplicaHistory")
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes")
const addReplicaToPlan = require("../../utils/addReplicaToPlan")

const updateReplica = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.body.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    } else if (checkTokenResult && checkTokenResult.user && !checkTokenResult.user.onlyView) {
        errors.push('У вас нет прав изменять реплику')
    }

    if (!req.body.company) {
        errors.push('Выберите компанию')
    }

    if (!req.body.project) {
        errors.push('Выберите проект')
    }

    if (!req.body.msg) {
        errors.push('Введите текст реплики')
    }

    if (!req.body.url) {
        errors.push('Введите URL')
    }

    if (!req.body.category && req.body.replicaType !== 1) {
        errors.push('Выберите категорию')
    }

    if (!req.body.id && !req.body.agentName) {
        errors.push('Введите имя агента')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user

        if (req.body.id) {
            // Обновляем реплику
            const replica = await Replica.findOne({
                _id: req.body.id,
                deleted: false,
            })

            if (replica) {
                const replicaStatus = replica.status.toString()

                replica.modifiedBy = user._id.toString()
                replica.modifiedDate = Date.now()
                replica.category = (req.body.category ? req.body.category : null)
                replica.status = (req.body.type === 'public' ? statusesList.waiting : statusesList.created)
                replica.platform = req.body.platform
                replica.url = req.body.url
                replica.noteSystem = (req.body.noteSystem ? req.body.noteSystem : null)

                if (replicaStatus !== replica.status.toString()) {
                    replica.statusChange = Date.now()

                    // Отправляем письмо
                    const transport = nodemailer.createTransport(config.SMTP_SETTINGS)

                    const usersInProject = await UsersInProject.find({
                        projectId: replica.project.toString(),
                        deleted: false,
                        active: true
                    })
                        .select('userId projectId')
                        .populate({
                            path: 'userId',
                            select: '_id name lastName email deleted role notifyReplicaStatusChange',
                            populate: {
                                path: 'role',
                                select: '_id name accessLevel',
                            }
                        })
                        .populate({
                            path: 'projectId',
                            select: '_id name companyId',
                            populate: {
                                path: 'companyId',
                                select: '_id name',
                            }
                        })

                    if (usersInProject) {
                        for (const usersInProjectData of usersInProject) {
                            if (
                                usersInProjectData.userId
                                && !usersInProjectData.userId.deleted
                                && usersInProjectData.userId.role.accessLevel === 2
                                && usersInProjectData.userId.notifyReplicaStatusChange
                            ) {
                                const emailOptions = {
                                    status: replica.status.toString(),
                                    email: usersInProjectData.userId.email,
                                    company: usersInProjectData.projectId.companyId.name,
                                    project: usersInProjectData.projectId.name,
                                    platform: replica.platform,
                                    msg: `Изменён статус реплики`,
                                }

                                await transport.sendMail(emailReplicaChangeStatus(emailOptions))
                            }
                        }
                    }
                }

                await replica.save()

                // Логируем сообщение реплики
                const replicaMsgItem = await ReplicaMsg.findOne({
                    replica: req.body.id,
                    deleted: false,
                }).sort([['createdDate', -1]])

                if (!replicaMsgItem || (replicaMsgItem && replicaMsgItem.msg && replicaMsgItem.msg !== req.body.msg)) {
                    const replicaMsg = new ReplicaMsg({
                        createdBy: user._id.toString(),
                        createdDate: Date.now(),
                        deleted: false,
                        replica: req.body.id,
                        msg: req.body.msg,
                        comment: '',
                    })

                    await replicaMsg.save()
                }

                // Логируем настройки реплик
                if (req.body.custom) {
                    for (const fieldId of Object.keys(req.body.custom)) {
                        const field = req.body.custom[fieldId]

                        if (field.name) {
                            let fieldAdd = false

                            const replicaFieldsItem = await ReplicaFields.findOne({
                                replica: req.body.id,
                                field: field.name,
                                deleted: false,
                            }).populate('field').sort([['createdDate', -1]])

                            if (replicaFieldsItem) {
                                if (replicaFieldsItem.field.type === 'select' && replicaFieldsItem.valueOptions.toString() !== field.value) {
                                    fieldAdd = true
                                } else if (replicaFieldsItem.field.type !== 'select' && replicaFieldsItem.value !== field.value) {
                                    fieldAdd = true
                                }
                            } else {
                                fieldAdd = true
                            }

                            if (fieldAdd && field.value) {
                                const replicaFields = new ReplicaFields({
                                    createdBy: user._id.toString(),
                                    createdDate: Date.now(),
                                    deleted: false,
                                    replica: req.body.id,
                                    field: fieldId,
                                    value: (field.fieldType === 'select' ? null : (field.value ? field.value : null)),
                                    valueOptions: (field.fieldType === 'select' ? (field.value ? field.value : null) : null),
                                })

                                await replicaFields.save()
                            }
                        }
                    }
                }

                await addReplicaHistory({
                    id: replica._id.toString(),
                    userId: user._id.toString(),
                    msg: (req.body.msg ? req.body.msg : ''),
                    msgOld: (replicaMsgItem && replicaMsgItem.msg ? replicaMsgItem.msg : ''),
                    status: false,
                    type: replicaHistoryTypes.edit,
                })

                if (replicaStatus !== replica.status.toString()) {
                    await addReplicaHistory({
                        id: replica._id.toString(),
                        userId: user._id.toString(),
                        msg: null,
                        msgOld: null,
                        status: replica.status,
                        type: replicaHistoryTypes.changeStatus,
                    })
                }

                addSearchContentForReplica(req.body.id)
            } else {
                return res.json(getErrorData('Реплика не найдена'))
            }
        } else {
            // Создаем новую реплику
            let status = (req.body.type === 'public' ? statusesList.waiting : statusesList.created)

            if (req.body.replicaType && req.body.replicaType === 2 && !req.body.parentId) {
                status = statusesList.posted
            }

            const replica = new Replica({
                createdBy: user._id.toString(),
                createdDate: Date.now(),
                deleted: false,
                company: req.body.company,
                project: req.body.project,
                category: (req.body.category ? req.body.category : null),
                status: status,
                date: Date.now(),
                platform: req.body.platform,
                url: req.body.url,
                agentName: req.body.agentName,
                type: (req.body.replicaType === 1 || req.body.replicaType === 2 ? req.body.replicaType : null),
                parentId: ((req.body.replicaType === 1 || req.body.replicaType === 2) && req.body.parentId ? req.body.parentId : null),
                statusChange: Date.now(),
                noteSystem: (req.body.noteSystem ? req.body.noteSystem : null),
            })

            const replicaNew = await replica.save()
            const replicaId = replicaNew._id.toString()

            if (replicaId) {
                const replicaMsg = new ReplicaMsg({
                    createdBy: user._id.toString(),
                    createdDate: Date.now(),
                    deleted: false,
                    replica: replicaId,
                    msg: req.body.msg,
                    comment: '',
                })

                await replicaMsg.save()

                if (req.body.custom) {
                    for (const fieldId of Object.keys(req.body.custom)) {
                        const field = req.body.custom[fieldId]

                        if (field.value) {
                            const replicaFields = new ReplicaFields({
                                createdBy: user._id.toString(),
                                createdDate: Date.now(),
                                deleted: false,
                                replica: replicaId,
                                field: fieldId,
                                value: (field.fieldType === 'select' ? null : (field.value ? field.value : null)),
                                valueOptions: (field.fieldType === 'select' ? (field.value ? field.value : null) : null),
                            })

                            await replicaFields.save()
                        }
                    }
                }

                await addReplicaHistory({
                    id: replicaId.toString(),
                    userId: user._id.toString(),
                    msg: (req.body.msg ? req.body.msg : ''),
                    msgOld: '',
                    status: false,
                    type: replicaHistoryTypes.create,
                })

                addSearchContentForReplica(replicaId)
                await addReplicaToPlan(user, replicaId)

                // Отправляем письмо
                const transport = nodemailer.createTransport(config.SMTP_SETTINGS)

                const usersInProject = await UsersInProject.find({
                    projectId: req.body.project,
                    deleted: false,
                    active: true
                })
                    .select('userId projectId')
                    .populate({
                        path: 'userId',
                        select: '_id name lastName email deleted role notifyReplicaAdd',
                        populate: {
                            path: 'role',
                            select: '_id name accessLevel',
                        }
                    })
                    .populate({
                        path: 'projectId',
                        select: '_id name companyId',
                        populate: {
                            path: 'companyId',
                            select: '_id name',
                        }
                    })

                if (usersInProject) {
                    for (const usersInProjectData of usersInProject) {
                        if (
                            usersInProjectData.userId
                            && !usersInProjectData.userId.deleted
                            && usersInProjectData.userId.role.accessLevel === 2
                            && usersInProjectData.userId.notifyReplicaAdd
                        ) {
                            const emailOptions = {
                                email: usersInProjectData.userId.email,
                                company: usersInProjectData.projectId.companyId.name,
                                project: usersInProjectData.projectId.name,
                                text: `Добавлена новая реплика`,
                            }

                            await transport.sendMail(emailReplicaAdd(emailOptions))
                        }
                    }
                }
            }
        }

        res.json({
            status: 'success',
        })
    }
}

module.exports = updateReplica