/* ==========================================================================
   Изменение URL у реплики
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")
const addReplicaHistory = require("./utils/addReplicaHistory")
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes")
const getURL = require("../replica/utils/getUrl")
const addSearchContentForReplica = require("../../search/replica")

const changeURL = async (req, res) => {
	const errors = []
	const checkTokenResult = await checkToken(req.body.token) || {}

	if (checkTokenResult.status === 'fail') {
		errors.push(checkTokenResult.errorText)
	}

	if (!req.params.replicaId) {
		errors.push('Реплика не указана')
	}

	if (!req.body.url) {
		errors.push('URL адрес не может быть пустым')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = checkTokenResult.user

		const replica = await Replica.findOne({
			_id: req.params.replicaId,
		})

		if (replica) {
			const url = replica.url

			replica.url = req.body.url
			replica.platform = (req.body.url && getURL(req.body.url) ? getURL(req.body.url) : false)
			replica.modifiedBy = user._id.toString()
			replica.modifiedDate = Date.now()

			await replica.save()

			if (replica.url !== url) {
				await addReplicaHistory({
					id: replica._id.toString(),
					userId: user._id.toString(),
					msg: 'URL: ' + (replica.url ? replica.url : ''),
					msgOld: 'URL: ' + (url ? url : ''),
					status: false,
					type: replicaHistoryTypes.changeField,
				})
			}

			addSearchContentForReplica(replica._id.toString())
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = changeURL