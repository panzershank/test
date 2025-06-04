/* ==========================================================================
   Получение списка сообщений реплики
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const ReplicaMsg = require("../../models/replica-msg")
const ReplicaHistory = require("../../models/replica-history")
const ReplicaHistoryType = require("../../models/replica-history-type")
const moment = require("moment")
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes")

const getReplicaMsg = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (!req.params.replica) {
        errors.push('Реплика не указана')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const replicaMsgCopy = []
        const editHistory = []

        const replicaMsg = await ReplicaMsg.find({
            replica: req.params.replica,
            deleted: false,
        })
            .select('msg comment createdDate modifiedDate status')
            .populate('status', 'name code')
            .sort([['createdDate', -1]])

        if (replicaMsg) {
            replicaMsg.map((replicaMsgData, index) => {
                if (index < 1) {
                    //  && !replicaMsgData.comment
                    return false
                } else {
                    return replicaMsgCopy.push(replicaMsgData)
                }
            })
        }

        const history = await ReplicaHistory.find({
            replica: req.params.replica,
        })
            .select('createdBy createdDate msg msgOld status type')
            .populate('createdBy', 'lastName name')
            .populate('status', 'name code')
            .populate({path: 'type', select: 'name code', model: ReplicaHistoryType})
            .sort([['sort', -1]])

        if (history && history.length) {
            for (const item of history) {
                if (item.createdDate && item.createdBy && item.createdBy.name && item.type && item.type._id && item.type._id.toString()) {
                    const type = item.type._id.toString()

                    const info = {
                        id: item._id.toString(),
                        date: moment(item.createdDate).format('DD.MM.YYYY HH:mm'),
                        author: item.createdBy.name + (item.createdBy.lastName ? ' ' + item.createdBy.lastName : ''),
                        typeChange: false,
                        oldReplica: '',
                        newReplica: '',
                        status: null,
                    }

                    if (type === replicaHistoryTypes.create) {
                        info.typeChange = 'created'
                    } else if (type === replicaHistoryTypes.edit) {
                        info.typeChange = 'replica'
                    } else if (type === replicaHistoryTypes.changeStatus) {
                        info.typeChange = 'status'
                    } else if (type === replicaHistoryTypes.repair) {
                        info.typeChange = 'repair'
                    } else if (type === replicaHistoryTypes.changeField) {
                        info.typeChange = 'replica'
                    }

                    if (type === replicaHistoryTypes.changeStatus) {
                        info.status = (item.status ? item.status : null)
                    } else {
                        info.newReplica = (item.msg ? item.msg : '')
                        info.oldReplica = (item.msgOld ? item.msgOld : '')
                    }

                    if (info.typeChange) {
                        editHistory.push(info)
                    }
                }
            }
        }

        res.json({
            status: 'success',
            data: replicaMsgCopy,
            editHistory: editHistory,
        })
    }
}

module.exports = getReplicaMsg