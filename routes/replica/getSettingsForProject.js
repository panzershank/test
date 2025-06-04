/* ==========================================================================
   Получаем список настроек проекта
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Projects = require("../../models/projects")
const ProjectsSettings = require("../../models/projects-settings")
const ProjectsSettingsOptions = require("../../models/projects-settings-options")

const getSettingsForProject = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    // Проверяем наличие проекта
    if (!req.params.project) {
        errors.push('Проект не найден')
    } else if (req.params.project.length !== 24) {
        errors.push('ID проекта указан неверно')
    } else {
        const project = await Projects.findById(req.params.project)

        if (!project) {
            errors.push('Проект не найден')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const projectsSettings = await ProjectsSettings.find({
            deleted: false,
            project: req.params.project,
        })
            .select('project type sort name viewReplica')
            .sort([['sort', 1]])

        const projectsSettingsCopy = []

        if (projectsSettings.length) {
            for (const field of projectsSettings) {
                const data = {
                    project: field.project.toString(),
                    type: field.type,
                    sort: field.sort,
                    name: field.name,
                    viewReplica: field.viewReplica,
                    _id: field._id.toString(),
                }

                if (field.type === 'select') {
                    data.options = []

                    const projectsSettingsOptions = await ProjectsSettingsOptions.find({
                        deleted: false,
                        field: field._id,
                    }).sort([['value', 1]])

                    if (projectsSettingsOptions) {
                        data.options = projectsSettingsOptions
                    }
                }

                projectsSettingsCopy.push(data)
            }

            res.json({
                status: 'success',
                data: projectsSettingsCopy,
            })
        } else {
            res.json({
                status: 'success',
                data: [],
            })
        }
    }
}

module.exports = getSettingsForProject