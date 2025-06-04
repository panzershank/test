/* ==========================================================================
   Выбираем список проектов для пользователя
   ========================================================================== */

const Projects = require("../../../models/projects")
const UsersInProject = require("../../../models/users-in-project")

const getProjects = async (user, companyId) => {
    const arrProjects = []

    if (user) {
        const filterProjects = {
            active: true,
            deleted: false,
        }

        if (companyId) {
            filterProjects.companyId = companyId
        } else if (user.companyId) (
            filterProjects.companyId = user.companyId
        )

        if (filterProjects.companyId) {
            if (user.role.accessLevel === 1) {
                const projects = await Projects.find(filterProjects).sort([['name', 1]])

                if (projects) {
                    for (const item of projects) {
                        arrProjects.push(item)
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
                    for (const item of usersInProject) {
                        const projectId = item.projectId.toString()
                        projectsId[projectId] = projectId
                    }
                }

                if (Object.keys(projectsId).length) {
                    const projects = await Projects.find({
                        _id: Object.keys(projectsId),
                    }).sort([['name', 1]])

                    if (projects) {
                        for (const item of projects) {
                            arrProjects.push(item)
                        }
                    }
                }
            }
        }
    }

    return (arrProjects.length ? arrProjects.map(item => ({
        id: item._id.toString(),
        name: item.name,
        frequencyHide: (!!item.analysisFrequencyHide),
    })) : [])
}

module.exports = getProjects