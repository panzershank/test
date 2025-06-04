/* ==========================================================================
   Изменяем статус реплики
   ========================================================================== */

const nodemailer = require("nodemailer")
const config = require("../../config")
const emailReplicaChangeStatus = require("../../emails/replicaChangeStatus")
const UsersInProject = require('../../models/users-in-project')
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")
const statusesList = require('../../utils/statuses')
const addReplicaHistory = require("./utils/addReplicaHistory")
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes")

const updateReplicaStatus = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token) || {}
    let status = false

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (!req.params.status) {
        errors.push('Статус не указан')
    } else if (req.params.status === 'posting') {
        status = statusesList.posting
    } else if (req.params.status === 'moderation') {
        status = statusesList.moderation
    } else if (req.params.status === 'posted') {
        status = statusesList.posted
    } else if (req.params.status === 'created') {
        status = statusesList.created
    } else if (req.params.status === 'waiting-agreement') {
        status = statusesList.waiting
    }

    if (!status) {
        errors.push('Статус не найден')
    }

    if (!req.params.replica) {
        errors.push('ID реплики не указан')
    } else if (req.params.replica.length !== 24) {
        errors.push('ID реплики указан неверно')
    }

    const replica = await Replica.findById(req.params.replica)

    if (!replica) {
        errors.push('Реплика не найдена')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user
        const replicaStatus = replica.status.toString()

        replica.modifiedBy = user._id
        replica.modifiedDate = Date.now()
        replica.status = status

        if (replicaStatus !== replica.status.toString()) {
            replica.statusChange = Date.now()
        }

        await replica.save()

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

        res.json({
            status: 'success',
            data: replica
        })
    }
}

module.exports = updateReplicaStatus
