/* ==========================================================================
   Отправляем уведомления по проекту
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Projects = require("../../models/projects")
const ProjectsNotice = require("../../models/projects-notice")
const sendMessage = require("./utils/sendMessage")

const sendNotice = async (req, res) => {
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
			if (!projects.changes) {
				errors.push('Изменений в проекте не было')
			} else {
				const projectsNotice = await ProjectsNotice.findOne({
					project: projects._id.toString(),
					deleted: false,
				})

				if (!projectsNotice || (projectsNotice && !projectsNotice._id)) {
					errors.push('У проекта нет получателей для уведомления')
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

		const projectsNotice = await ProjectsNotice.find({
			project: req.body.project.toString(),
			deleted: false,
		})
			.populate("user", "telegramChat")
			.populate("project", "_id name")

		if (projectsNotice && projectsNotice.length) {
			for (const item of projectsNotice) {
				if (item.project && item.project.name && item.project.toString() && item.user && item.user.telegramChat) {
					await sendMessage(item.user.telegramChat, "Здравствуйте! \nПо проекту " + item.project.name + " были отредактированы реплики. \nДля просмотра изменений перейдите в личный кабинет <a href='https://orm.amdg.ru/'>RQ view</a>.", item.user._id.toString())
				}
			}

			const projects = await Projects.findOne({
				_id: req.body.project,
			})

			if (projects && projects._id) {
				projects.changes = false
				await projects.save()
			}
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = sendNotice