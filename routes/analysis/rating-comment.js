/* ==========================================================================
   Изменение тональности для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")
const AnalysisComments = require("../../models/analysis-comments")

const ratingComment = async (req, res) => {
	const errors = []
	const data = await checkToken(req.body.token)
	const queryId = (req.params.id && req.params.id.length === 24 ? req.params.id : '')
	const msg = (req.body.msg ? req.body.msg : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!queryId) {
		errors.push('Данные не найдены')
	}

	if (!msg) {
		errors.push('Напишите сообщение')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = data.user

		const queryDetail = await AnalysisQueriesDetail.findOne({
			_id: queryId,
			deleted: false,
		}).populate('query', '_id project')

		if (queryDetail && queryDetail.query && queryDetail.query.project && queryDetail.query.project.toString() && queryDetail.url) {
			const name = []

			if (user.lastName) {
				name.push(user.lastName)
			}

			if (user.name) {
				name.push(user.name)
			}

			const analysisComments = new AnalysisComments({
				createdBy: user._id.toString(),
				createdDate: Date.now(),
				deleted: false,
				project: queryDetail.query.project.toString(),
				url: queryDetail.url,
				date: Date.now(),
				text: msg,
				authorName: (name && name.length ? name.join(' ') : ''),
			})

			await analysisComments.save()
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = ratingComment