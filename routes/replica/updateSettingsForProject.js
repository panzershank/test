/* ==========================================================================
   Добавление новых настроек для проекта + обновление
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Companies = require("../../models/companies")
const Projects = require("../../models/projects")
const ProjectsSettings = require("../../models/projects-settings")
const ProjectsSettingsOptions = require("../../models/projects-settings-options")

const updateSettingsForProject = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.body.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    // Проверяем наличие компании
    if (!req.body.company) {
        errors.push('Компания не найдена')
    } else if (req.body.company.length !== 24) {
        errors.push('ID компании указан неверно')
    } else {
        const company = await Companies.findById(req.body.company)

        if (!company) {
            errors.push('Компания не найдена')
        }
    }

    // Проверяем наличие проекта
    if (!req.body.project) {
        errors.push('Проект не найден')
    } else if (req.body.project.length !== 24) {
        errors.push('ID проекта указан неверно')
    } else {
        const project = await Projects.findById(req.body.project)

        if (!project) {
            errors.push('Проект не найден')
        }
    }

    // Проверяем наличие кастомных полей
    if (!req.body.custom) {
        errors.push('Добавьте хотя бы 1 поле')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user

        Object.keys(req.body.custom).map(async (fieldId) => {
            const field = req.body.custom[fieldId]

            if (field.fieldId) {
                const projectsSettings = await ProjectsSettings.findById(field.fieldId)

                if (projectsSettings) {
                    projectsSettings.modifiedBy = user._id.toString()
                    projectsSettings.modifiedDate = Date.now()
                    projectsSettings.deleted = field.deleted
                    projectsSettings.type = field.fieldType
                    projectsSettings.sort = field.sort
                    projectsSettings.name = field.value
                    projectsSettings.viewReplica = field.viewReplica

                    await projectsSettings.save()

                    if (field.fieldType === 'select' && field.options.length) {
                        field.options.map(async (option) => {
                            if (option.fieldId) {
                                const projectsSettingsOptions = await ProjectsSettingsOptions.findById(option.fieldId)

                                projectsSettingsOptions.value = option.value
                                projectsSettingsOptions.deleted = option.deleted

                                await projectsSettingsOptions.save()
                            } else {
                                if (option.deleted !== true) {
                                    const projectsSettingsOptions = new ProjectsSettingsOptions({
                                        field: field.fieldId,
                                        value: option.value,
                                        deleted: false,
                                    })

                                    await projectsSettingsOptions.save()
                                }
                            }
                        })
                    }
                }
            } else if (field.deleted !== true) {
                const projectsSettings = new ProjectsSettings({
                    createdBy: user._id.toString(),
                    createdDate: Date.now(),
                    deleted: false,
                    project: req.body.project,
                    type: field.fieldType,
                    sort: field.sort,
                    name: field.value,
                    viewReplica: field.viewReplica,
                })

                const newField = await projectsSettings.save()

                if (newField._id && field.fieldType === 'select' && field.options.length) {
                    field.options.map(async (option) => {
                        if (option.deleted !== true) {
                            const projectsSettingsOptions = new ProjectsSettingsOptions({
                                field: newField._id.toString(),
                                value: option.value,
                                deleted: false,
                            })

                            await projectsSettingsOptions.save()
                        }
                    })
                }
            }
        })

        res.json({
            status: 'success',
        })
    }
}

module.exports = updateSettingsForProject