/* ==========================================================================
   Выбираем и возвращаем список доступных компаний для пользователя
   Если пользователь админ - выбираем все компании
   В противном случае выбираем только те компании, к которым у пользователя есть доступ
   ========================================================================== */

const Users = require('../../../models/users')
const Companies = require('../../../models/companies')
const UsersInProject = require('../../../models/users-in-project')

const getCompanies = async (userId) => {
    const companies = []

    if (userId) {
        const user = await Users.findOne({
            _id: userId.toString(),
            deleted: false
        }).populate('role', 'name accessLevel')

        if (user) {
            if (user.role.accessLevel === 1) {
                const data = await Companies.find({
                    active: true,
                    deleted: false,
                }).sort([['name', 1]])

                if (data) {
                    for (const company of data) {
                        companies.push(company)
                    }
                }
            } else {
                const companiesId = []

                const usersInProject = await UsersInProject.find({
                    active: true,
                    deleted: false,
                    userId: user._id.toString()
                }).populate('projectId', '_id companyId').select('projectId')

                if (usersInProject) {
                    usersInProject.map((data) => {
                        const companyId = data.projectId.companyId
                        return companiesId[companyId] = companyId
                    })
                }

                if (Object.keys(companiesId).length) {
                    const data = await Companies.find({
                        _id: Object.keys(companiesId),
                        active: true,
                        deleted: false,
                    }).sort([['name', 1]])

                    if (data) {
                        for (const company of data) {
                            companies.push(company)
                        }
                    }
                }
            }
        }
    }

    return companies
}

module.exports = getCompanies