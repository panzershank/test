/* ==========================================================================
   Массово удалить реплики
   ========================================================================== */

const nodemailer = require("nodemailer")
const config = require("../../config")
const emailReplicaDelete = require("../../emails/replicaDelete")
const UsersInProject = require('../../models/users-in-project')
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")

const deleteReplicaMany = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.body.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (!req.body.ids || (req.body.ids && req.body.ids.length < 1)) {
        errors.push('Реплики для удаления не найдены')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user

        const replica = await Replica.find({
            _id: req.body.ids,
            deleted: false,
        })

        if (replica && replica.length) {
            for (const item of replica) {
                item.deleted = true
                item.modifiedBy = user._id
                item.modifiedDate = Date.now()

                await item.save()

                // Удаляем дочерние реплики
                const replicaChildren = await Replica.find({
                    parentId: item._id.toString(),
                    deleted: false,
                }) || []

                if (replicaChildren.length) {
                    for (const itemChildren of replicaChildren) {
                        itemChildren.deleted = true
                        itemChildren.modifiedBy = user._id
                        itemChildren.modifiedDate = Date.now()

                        await itemChildren.save()
                    }
                }
            }

            // Отправляем письмо
            const transport = nodemailer.createTransport(config.SMTP_SETTINGS)

            const usersInProject = await UsersInProject.find({
                projectId: replica[0].project.toString(),
                deleted: false,
                active: true
            })
                .select('userId projectId')
                .populate({
                    path: 'userId',
                    select: '_id name lastName email deleted role notifyReplicaDelete',
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
                        && usersInProjectData.userId.notifyReplicaDelete
                    ) {
                        const emailOptions = {
                            status: replica[0].status.toString(),
                            email: usersInProjectData.userId.email,
                            company: usersInProjectData.projectId.companyId.name,
                            project: usersInProjectData.projectId.name,
                            platform: replica[0].platform,
                            msg: `Удалено ${replica.length} реплик`,
                            lastName: usersInProjectData.userId.lastName,
                            name: usersInProjectData.userId.name,
                            role: usersInProjectData.userId.role.name,
                        }

                        await transport.sendMail(emailReplicaDelete(emailOptions))
                    }
                }
            }
        }

        res.json({
            status: 'success',
        })
    }
}

module.exports = deleteReplicaMany