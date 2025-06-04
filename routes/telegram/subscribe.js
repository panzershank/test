/* ==========================================================================
   Подписываем пользователя на уведомления по проекту
   ========================================================================== */

const TelegramLogin = require("../../models/telegramLogin")
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Projects = require("../../models/projects")
const ProjectsNotice = require("../../models/projects-notice")

const subscribe = async (req, res) => {
	const errors = []
	const checkTokenResult = await checkToken(req.body.token) || {}

	if (checkTokenResult.status === 'fail') {
		errors.push(checkTokenResult.errorText)
	}

	if (!req.body.project) {
		errors.push('Проект не указан')
	} else if (req.body.project.toString().length !== 24) {
		errors.push('Проект указан с ошибкой')
	} else {
		const projects = await Projects.findOne({
			_id: req.body.project,
		})

		if (projects && projects._id) {
			if (checkTokenResult && checkTokenResult.user && checkTokenResult.user._id) {
				const projectsNotice = await ProjectsNotice.findOne({
					project: projects._id.toString(),
					user: checkTokenResult.user._id.toString(),
					deleted: false,
				})

				if (projectsNotice && projectsNotice._id) {
					errors.push('Вы уже подписаны на этот проект')
				}
			}
		} else {
			errors.push('Проект не найден в системе')
		}
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = checkTokenResult.user

		const projectsNotice = new ProjectsNotice({
			createdBy: user._id.toString(),
			createdDate: Date.now(),
			project: req.body.project.toString(),
			user: checkTokenResult.user._id.toString(),
			deleted: false,
		})

		await projectsNotice.save()

		res.json({
			status: 'success',
		})
	}
}

module.exports = subscribe