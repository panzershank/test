/* ==========================================================================
   Добавляем имя агента к реплике
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")
const addReplicaHistory = require("./utils/addReplicaHistory");
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes");

const addAgentNameForReplica = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.body.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (!req.params.replicaId) {
        errors.push('Реплика не указана')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user

        const replica = await Replica.findOne({
            _id: req.params.replicaId,
        })

        if (replica) {
            const agentName = replica.agentName

            replica.agentName = req.body.agentName
            replica.modifiedBy = user._id.toString()
            replica.modifiedDate = Date.now()

            await replica.save()

            if (replica.agentName !== agentName) {
                await addReplicaHistory({
                    id: replica._id.toString(),
                    userId: user._id.toString(),
                    msg: 'Имя агента: ' + (replica.agentName ? replica.agentName : ''),
                    msgOld: 'Имя агента: ' + (agentName ? agentName : ''),
                    status: false,
                    type: replicaHistoryTypes.changeField,
                })
            }
        }

        res.json({
            status: 'success',
        })
    }
}

module.exports = addAgentNameForReplica