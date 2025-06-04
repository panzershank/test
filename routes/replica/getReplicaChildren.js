/* ==========================================================================
   Получение списка дочерних реплик
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")
const ReplicaMsg = require("../../models/replica-msg")
const ReplicaFields = require("../../models/replica-fields")
const UsersInProject = require("../../models/users-in-project")

const getReplicaChildren = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (!req.params.id) {
        errors.push('Реплики не найдены')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user
        let replica = []

        // Фильтр по репликам
        const replicaFilter = {
            deleted: false,
            parentId: req.params.id,
        }

        if (user.role.accessLevel === 1) {
            replica = await Replica.find(replicaFilter)
                .select('date platform url status project company project category screenshot agentName type noteSystem')
                .populate('company', 'name')
                .populate('project', 'name')
                .populate('category', 'name')
                .populate('status', 'name code')
                .sort([['date', 1]])
        } else {
            const projectsId = []

            const usersInProject = await UsersInProject.find({
                active: true,
                deleted: false,
                userId: user._id.toString()
            }).populate('projectId', '_id companyId').select('projectId')

            if (usersInProject) {
                usersInProject.map(data => {
                    const projectId = data.projectId._id.toString()
                    return projectsId.push(projectId)
                })
            }

            if (projectsId.length) {
                if (!replicaFilter.project) {
                    replicaFilter.project = projectsId
                }

                replica = await Replica.find(replicaFilter)
                    .select('date platform url status project company project category screenshot agentName type noteSystem')
                    .populate('company', 'name')
                    .populate('project', 'name')
                    .populate('category', 'name')
                    .populate('status', 'name code')
                    .sort([['date', 1]])
            } else {
                return res.json({
                    status: 'success',
                    data: [],
                })
            }
        }

        if (replica.length) {
            const replicaCopy = []

            for (const replicaData of replica) {
                const data = {
                    _id: replicaData._id.toString(),
                    company: replicaData.company,
                    project: replicaData.project,
                    category: replicaData.category,
                    date: replicaData.date,
                    platform: replicaData.platform,
                    url: replicaData.url,
                    status: replicaData.status,
                    screenshot: replicaData.screenshot,
                    agentName: replicaData.agentName,
                    msg: false,
                    fields: [],
                    type: (replicaData.type ? replicaData.type : false),
                    noteSystem: (replicaData.noteSystem ? replicaData.noteSystem : ''),
                }

                // Выбираем самое свежее сообщение внутри реплики
                const replicaMsg = await ReplicaMsg.findOne({
                    replica: data._id,
                    deleted: false,
                }).select('msg comment').sort([['createdDate', -1]])

                if (replicaMsg) {
                    data.msg = replicaMsg
                }

                // Выбираем список полей проекта
                const replicaFields = await ReplicaFields.find({
                    replica: data._id,
                    deleted: false,
                })
                    .select('createdDate field value valueOptions')
                    .populate('field', 'type name viewReplica deleted sort')
                    .populate('valueOptions', 'value deleted')
                    .sort([['createdDate', -1]])

                if (replicaFields) {
                    const replicaFieldsNew = []
                    const replicaFieldsIdx = {}

                    for (const replicaFieldsData of replicaFields) {
                        const fieldId = replicaFieldsData.field._id.toString()

                        if (!replicaFieldsIdx[fieldId]) {
                            replicaFieldsIdx[fieldId] = fieldId
                            replicaFieldsNew.push(replicaFieldsData)
                        }
                    }

                    data.fields = replicaFieldsNew
                }

                replicaCopy.push(data)
            }

            res.json({
                status: 'success',
                data: replicaCopy,
            })
        } else {
            res.json({
                status: 'success',
                data: [],
            })
        }
    }
}

module.exports = getReplicaChildren