const Projects = require("../models/projects")
const Users = require("../models/users")

module.exports = async function (projectId) {
    if (projectId) {
        const project = await Projects.findOne({
            _id: projectId,
            deleted: false,
        })

        if (project) {
            const users = await Users.find({
                companyId: project.companyId,
                deleted: false,
            })

            const arrSearch = []

            if (project.name) {
                arrSearch.push(project.name.toLowerCase())
            }

            if (users) {
                for (const userData of users) {
                    if (userData.name) {
                        arrSearch.push(userData.name.toLowerCase())
                    }

                    if (userData.lastName) {
                        arrSearch.push(userData.lastName.toLowerCase())
                    }

                    if (userData.email) {
                        arrSearch.push(userData.email.toLowerCase())
                    }
                }
            }

            if (arrSearch.length) {
                project.search = arrSearch.join(' ')
            } else {
                project.search = ''
            }

            await project.save()
        }
    }
}