/* ==========================================================================
   Изменение тональности для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")

const searchTonality = async (req, res) => {
	const errors = []
	const data = await checkToken(req.body.token)
	const queryId = (req.params.id && req.params.id.length === 24 ? req.params.id : '')
	const tonality = (req.body.tonality ? req.body.tonality : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!queryId) {
		errors.push('Данные не найдены')
	}

	if (!tonality || (tonality && tonality !== 'positive' && tonality !== 'negative' && tonality !== 'neutral' && tonality !== 'pending')) {
		errors.push('Тональность не указана')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = data.user

		const queryDetail = await AnalysisQueriesDetail.findOne({
			_id: queryId,
			deleted: false,
		})

		if (queryDetail) {
			queryDetail.modifiedBy = user._id
			queryDetail.modifiedDate = Date.now()
			queryDetail.tonality = tonality

			await queryDetail.save()
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = searchTonality