/* ==========================================================================
   Изменение тональности для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisComments = require("../../models/analysis-comments")

const ratingCommentDelete = async (req, res) => {
	const errors = []
	const data = await checkToken(req.body.token)
	const commentId = (req.params.id && req.params.id.length === 24 ? req.params.id : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!commentId) {
		errors.push('Комментарий не найден')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = data.user

		const comment = await AnalysisComments.findOne({
			_id: commentId,
			deleted: false,
			// createdBy: user._id.toString(),
		})

		if (comment) {
			comment.modifiedBy = user._id
			comment.modifiedDate = Date.now()
			comment.deleted = true

			await comment.save()

			res.json({
				status: 'success',
			})
		} else {
			errors.push('Вы можете удалить только свой комментарий')
			return res.json(getErrorData(errors))
		}
	}
}

module.exports = ratingCommentDelete