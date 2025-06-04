/* ==========================================================================
   Выбор данных
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const getCompanies = require("./utils/getCompanies")
const getProjects = require("./utils/getProjects")
const getQueries = require("./utils/getQueries")
const getTypes = require("./utils/getTypes")
const getResults = require("./utils/getResults")

const loadData = async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = data.user

        const filterCompany = (req.query.company && req.query.company.length === 24 ? req.query.company : '')
        const filterProject = (req.query.project && req.query.project.length === 24 ? req.query.project : '')
        const filterQuery = req.query.query
        const filterDateFrom = req.query.dateFrom
        const filterDateTo = req.query.dateTo
        const filterDeepLevel = (req.query.deepLevel && req.query.deepLevel === 'top20' ? 20 : 10)
        const filterSearchSystem = req.query.searchSystem

        const arrCompanies = await getCompanies(user)
        const arrProjects = (filterCompany ? await getProjects(user, filterCompany) : [])
        const arrQueries = (filterProject ? await getQueries(filterProject) : [])
        const arrTypes = (filterProject && filterQuery && filterDateFrom && filterDateTo && filterDeepLevel && filterSearchSystem ? await getTypes() : [])

        const arrResults = (filterProject && filterQuery && filterDateFrom && filterDateTo && filterDeepLevel && filterSearchSystem ? await getResults({
            projectId: filterProject,
            query: filterQuery,
            dateFrom: filterDateFrom,
            dateTo: filterDateTo,
            deepLevel: filterDeepLevel,
            searchSystem: filterSearchSystem,
        }) : [])

        res.json({
            status: 'success',
            companies: arrCompanies,
            projects: arrProjects,
            queries: arrQueries,
            types: arrTypes,
            results: arrResults,
        })
    }
}

module.exports = loadData