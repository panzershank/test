const Companies = require("../models/companies")
const Projects = require("../models/projects")
const Users = require("../models/users")

module.exports = async function(companyId) {
    if (companyId) {
        const company = await Companies.findOne({
            _id: companyId,
            deleted: false,
        })

        const projects = await Projects.find({
            companyId: companyId,
            deleted: false,
        })

        const users = await Users.find({
            companyId: companyId,
            deleted: false,
        })

        if (company) {
            const arrSearch = []

            if (company.name) {
                arrSearch.push(company.name.toLowerCase())
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

            if (projects) {
                for (const projectsData of projects) {
                    if (projectsData.name) {
                        arrSearch.push(projectsData.name.toLowerCase())
                    }
                }
            }

            if (arrSearch.length) {
                company.search = arrSearch.join(' ')
            } else {
                company.search = ''
            }

            await company.save()
        }
    }
}