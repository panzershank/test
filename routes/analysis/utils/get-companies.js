/* ==========================================================================
   Выбираем список компаний для пользователя
   ========================================================================== */

const Companies = require("../../../models/companies")
const UsersInProject = require("../../../models/users-in-project")

const getCompanies = async (user) => {
    const companiesId = []
    const arrCompanies = []

    if (user) {
        if (user.role.accessLevel === 1) {
            const companies = await Companies.find({
                active: true,
                deleted: false,
            }).sort([['name', 1]])

            if (companies) {
                for (const item of companies) {
                    arrCompanies.push(item)
                }
            }
        } else {
            const usersInProject = await UsersInProject.find({
                active: true,
                deleted: false,
                userId: user._id.toString()
            }).populate('projectId', '_id companyId').select('projectId')

            if (usersInProject) {
                for (const item of usersInProject) {
                    const companyId = item.projectId.companyId
                    companiesId[companyId] = companyId
                }
            }

            if (Object.keys(companiesId).length) {
                const companies = await Companies.find({
                    _id: Object.keys(companiesId),
                    active: true,
                    deleted: false,
                }).sort([['name', 1]])

                if (companies) {
                    for (const item of companies) {
                        arrCompanies.push(item)
                    }
                }
            }
        }
    }

    return (arrCompanies.length ? arrCompanies.map(item => ({
        id: item._id.toString(),
        name: item.name,
    })) : [])
}

module.exports = getCompanies