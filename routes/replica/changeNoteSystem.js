/* ==========================================================================
   Изменение примечания у реплики
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Replica = require("../../models/replica")

const changeNoteSystem = async (req, res) => {
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
			replica.noteSystem = (req.body.text ? req.body.text : null)
			replica.modifiedBy = user._id.toString()
			replica.modifiedDate = Date.now()

			await replica.save()
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = changeNoteSystem