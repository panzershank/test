/* ==========================================================================
   Изменение тональности для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Projects = require("../../models/projects")

const frequencyToggle = async (req, res) => {
	const errors = []
	const data = await checkToken(req.body.token)
	const project = (req.body.project && req.body.project.length === 24 ? req.body.project : '')
	const action = (req.body.action ? req.body.action : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!project) {
		errors.push('Проект не указан')
	}

	if (!action) {
		errors.push('Действие не указано')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = data.user

		const projectInfo = await Projects.findOne({
			_id: project,
			deleted: false,
		})

		if (projectInfo) {
			projectInfo.modifiedBy = user._id
			projectInfo.modifiedDate = Date.now()
			projectInfo.analysisFrequencyHide = (action === 'on')

			await projectInfo.save()
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = frequencyToggle