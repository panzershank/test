/* ==========================================================================
   Удаление реплики
   ========================================================================== */

const nodemailer = require("nodemailer")
const config = require("../../config")
const emailReplicaDelete = require("../../emails/replicaDelete")
const UsersInProject = require('../../models/users-in-project')
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")

const deleteReplica = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token)

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    const replica = await Replica.findById(req.params.id)

    if (!replica) {
        errors.push('Реплика не найдена')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user

        replica.deleted = true
        replica.modifiedBy = user._id
        replica.modifiedDate = Date.now()

        await replica.save()

        // Удаляем дочерние реплики
        const replicaChildren = await Replica.find({
            parentId: replica._id.toString(),
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
                        status: replica.status.toString(),
                        email: usersInProjectData.userId.email,
                        company: usersInProjectData.projectId.companyId.name,
                        project: usersInProjectData.projectId.name,
                        platform: replica.platform,
                        msg: `Реплика удалена`,
                        lastName: usersInProjectData.userId.lastName,
                        name: usersInProjectData.userId.name,
                        role: usersInProjectData.userId.role.name,
                    }

                    await transport.sendMail(emailReplicaDelete(emailOptions))
                }
            }
        }

        res.json({
            status: 'success',
        })
    }
}

module.exports = deleteReplica