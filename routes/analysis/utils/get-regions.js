/* ==========================================================================
   Выбираем список регионов
   ========================================================================== */

const AnalysisQueries = require("../../../models/analysis-queries")

const getRegions = async ({ project, type, searchSystem }) => {
	const data = []
	const regions = {}

	const filter = {
		deleted: false,
	}

	if (project) {
		filter.project = project
	}

	if (searchSystem === 'yandex') {
		filter.searchSystem = 'Yandex'
	} else if (searchSystem === 'google') {
		filter.searchSystem = 'Google'
	}

	if (type) {
		filter.type = type
	}

	const analysisQueries = await AnalysisQueries.find(filter).sort([['region', 1]])

	if (analysisQueries && analysisQueries.length) {
		for (const query of analysisQueries) {
			regions[query.region] = query.region
		}
	}

	if (regions && Object.keys(regions).length) {
		for (const i of Object.keys(regions)) {
			data.push({
				id: regions[i],
				name: regions[i],
			})
		}
	}

	return data
}

module.exports = getRegions