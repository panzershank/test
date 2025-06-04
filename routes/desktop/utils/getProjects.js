/* ==========================================================================
   Выбираем и возвращаем список доступных проектов для пользователя внутри выбранной компании
   Если пользователь админ - выбираем все компании
   В противном случае выбираем только те проекты, к которым у пользователя есть доступ
   ========================================================================== */

const Users = require('../../../models/users')
const Companies = require('../../../models/companies')
const Projects = require('../../../models/projects')
const UsersInProject = require('../../../models/users-in-project')

const getProjects = async (userId, companyId) => {
    const projects = []

    if (userId && companyId) {
        const user = await Users.findOne({
            _id: userId.toString(),
            deleted: false
        }).populate('role', 'name accessLevel')

        const company = await Companies.findOne({
            _id: companyId.toString(),
            deleted: false
        })

        if (user && company) {
            if (user.role.accessLevel === 1) {
                const data = await Projects.find({
                    companyId: company._id.toString(),
                    deleted: false
                }).sort([['name', 1]])

                if (data) {
                    for (const company of data) {
                        projects.push(company)
                    }
                }
            } else {
                const projectsId = []

                const usersInProject = await UsersInProject.find({
                    active: true,
                    deleted: false,
                    userId: user._id.toString()
                }).select('projectId')

                if (usersInProject) {
                    usersInProject.map((data) => {
                        const projectId = data.projectId.toString()
                        return projectsId[projectId] = projectId
                    })
                }

                if (Object.keys(projectsId).length) {
                    const data = await Projects.find({
                        _id: Object.keys(projectsId),
                        active: true,
                        deleted: false,
                    }).sort([['name', 1]])

                    if (data) {
                        for (const company of data) {
                            projects.push(company)
                        }
                    }
                }
            }
        }
    }

    return projects
}

module.exports = getProjects