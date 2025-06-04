/* ==========================================================================
   Создание и редактирование реплики
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const ReplicaHistory = require("../../models/replica-history")
const addReplicaHistory = require("./utils/addReplicaHistory")
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes")
const ReplicaMsg = require("../../models/replica-msg")

const historyRepair = async (req, res) => {
	const errors = []
	const checkTokenResult = await checkToken(req.body.token) || {}

	if (checkTokenResult.status === 'fail') {
		errors.push(checkTokenResult.errorText)
	}

	if (!req.params.id) {
		errors.push('ID записи не указан')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = checkTokenResult.user

		const history = await ReplicaHistory.findOne({
			_id: req.params.id,
		})

		if (history && history._id) {
			const replicaMsg = await ReplicaMsg.findOne({
				replica: history.replica._id.toString(),
				deleted: false,
			}).sort([['createdDate', -1]])

			if (replicaMsg) {
				await addReplicaHistory({
					id: history.replica._id.toString(),
					userId: user._id.toString(),
					msg: (history.msgOld ? history.msgOld : ''),
					msgOld: (replicaMsg.msg ? replicaMsg.msg : ''),
					status: false,
					type: replicaHistoryTypes.repair,
				})

				const replicaMsgItem = await ReplicaMsg.findOne({
					replica: history.replica._id.toString(),
					deleted: false,
				}).sort([['createdDate', -1]])

				if (!replicaMsgItem || (replicaMsgItem && replicaMsgItem.msg && replicaMsgItem.msg !== history.msgOld)) {
					const replicaMsg = new ReplicaMsg({
						createdBy: user._id.toString(),
						createdDate: Date.now(),
						deleted: false,
						replica: history.replica._id.toString(),
						msg: (history.msgOld ? history.msgOld : ''),
						comment: '',
					})

					await replicaMsg.save()
				}
			}
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = historyRepair