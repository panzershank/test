/* ==========================================================================
   Выбор данных
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const getCompanies = require("./utils/get-companies")
const getProjects = require("./utils/get-projects")
const getRegions = require("./utils/get-regions")
const getQueries = require("./utils/get-queries")

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
		const filterType = (req.query.deepLevel && req.query.deepLevel === 'top20' ? 20 : (req.query.deepLevel && req.query.deepLevel === 'top30' ? 30 : 10))
		const filterSearchSystem = req.query.searchSystem
		const filterRegion = req.query.region

		const arrCompanies = await getCompanies(user)
		const arrProjects = (user.companyId || filterCompany ? await getProjects(user, filterCompany) : [])

		const arrRegions = (filterProject ? await getRegions({
			project: filterProject,
			type: filterType,
			searchSystem: filterSearchSystem,
		}) : [])

		const arrQueries = (filterProject && filterType && filterSearchSystem && filterRegion ? await getQueries({
			project: filterProject,
			type: filterType,
			searchSystem: filterSearchSystem,
			region: filterRegion,
		}) : [])

		res.json({
			status: 'success',
			regions: arrRegions,
			queries: arrQueries,
			companies: arrCompanies,
			projects: arrProjects,
		})
	}
}

module.exports = loadData