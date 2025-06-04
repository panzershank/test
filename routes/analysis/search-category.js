/* ==========================================================================
   Изменение тональности для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")

const searchCategory = async (req, res) => {
	const errors = []
	const data = await checkToken(req.body.token)
	const queryId = (req.params.id && req.params.id.length === 24 ? req.params.id : '')
	const category = (req.body.category && req.body.category.length === 24 ? req.body.category : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!queryId) {
		errors.push('Данные не найдены')
	}

	if (!category) {
		errors.push('Категория не найдена')
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
			queryDetail.category = category

			await queryDetail.save()
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = searchCategory