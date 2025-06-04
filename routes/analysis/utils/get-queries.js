/* ==========================================================================
   Выбираем поисковые запросы
   ========================================================================== */

const AnalysisQueries = require("../../../models/analysis-queries")

const getQueries = async ({ project, type, searchSystem, region }) => {
	const data = []
	const dataObj = {}

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

	if (region) {
		filter.region = region
	}

	const analysisQueries = await AnalysisQueries.find(filter).sort([['date', 1]])

	if (analysisQueries && analysisQueries.length) {
		for (const query of analysisQueries) {
			if (!dataObj[query.searchQuery]) {
				dataObj[query.searchQuery] = {}
			}

			dataObj[query.searchQuery].id = query._id.toString()
			dataObj[query.searchQuery].name = query.searchQuery
			dataObj[query.searchQuery].frequency = (query.frequency ? query.frequency : 0)
		}
	}

	if (dataObj && Object.keys(dataObj).length) {
		for (const i of Object.keys(dataObj)) {
			data.push(dataObj[i])
		}
	}

	return data
}

module.exports = getQueries