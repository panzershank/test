/* ==========================================================================
   Привязываем чат к пользователю по коду
   ========================================================================== */

const TelegramLogin = require("../../models/telegramLogin")
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Users = require("../../models/users")
const ProjectsNotice = require("../../models/projects-notice")
const Projects = require("../../models/projects");

const code = async (req, res) => {
	const errors = []
	const checkTokenResult = await checkToken(req.body.token) || {}
	let chat = false

	if (checkTokenResult.status === 'fail') {
		errors.push(checkTokenResult.errorText)
	}

	if (!req.body.code) {
		errors.push('Код не указан')
	} else {
		const telegramLogin = await TelegramLogin.findOne({
			code: req.body.code,
		})

		if (telegramLogin && telegramLogin._id) {
			chat = telegramLogin.chat
		} else {
			errors.push('Код не найден в системе')
		}
	}

	if (!req.body.project) {
		errors.push('Проект не указан')
	} else if (req.body.project.toString().length !== 24) {
		errors.push('Проект указан с ошибкой')
	} else {
		const projects = await Projects.findOne({
			_id: req.body.project,
		})

		if (!projects || (projects && !projects._id)) {
			errors.push('Проект не найден в системе')
		}
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const userData = checkTokenResult.user

		const user = await Users.findOne({
			_id: userData._id.toString(),
		})

		if (user && user._id) {
			user.telegramChat = chat
			user.modifiedBy = userData._id.toString()
			user.modifiedDate = Date.now()

			await user.save()

			await TelegramLogin.deleteOne({
				code: req.body.code,
			})

			const projectsNotice = new ProjectsNotice({
				createdBy: user._id.toString(),
				createdDate: Date.now(),
				project: req.body.project.toString(),
				user: checkTokenResult.user._id.toString(),
				deleted: false,
			})

			await projectsNotice.save()
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = code