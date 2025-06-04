/* ==========================================================================
   Выбор данных для таба "Анализ тональности"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueries = require("../../models/analysis-queries")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")
const moment = require("moment")

const tonalityList = async (req, res) => {
	const errors = []
	const data = await checkToken(req.query.token)
	const filterProject = (req.query.project && req.query.project.length === 24 ? req.query.project : '')
	const filterQuery = (req.query.query && (req.query.query.length === 24 || req.query.query === 'all') ? req.query.query : '')
	const filterDeepLevel = (req.query.deepLevel ? req.query.deepLevel : '')
	const filterSearchSystem = (req.query.searchSystem ? req.query.searchSystem : '')
	const filterRegion = (req.query.region ? req.query.region : '')
	const filterDateFrom = (req.query.dateFrom ? req.query.dateFrom : '')
	const filterDateTo = (req.query.dateTo ? req.query.dateTo : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!filterProject) {
		errors.push('Проект не найден')
	}

	if (!filterQuery) {
		errors.push('Поисковый запрос не найден')
	}

	if (!filterDeepLevel) {
		errors.push('Глубина просмотра не найдена')
	}

	if (!filterSearchSystem) {
		errors.push('Поисковая система не найдена')
	}

	if (!filterRegion) {
		errors.push('Регион не найден')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const content = []
		let queryName = ''

		if (filterQuery !== 'all') {
			const queryParent = await AnalysisQueries.findOne({
				deleted: false,
				_id: filterQuery,
			})

			if (queryParent && queryParent.searchQuery) {
				queryName = queryParent.searchQuery
			}
		}

		const isYandex = (filterSearchSystem.search(/yandex/i) !== -1 || filterSearchSystem.search(/Yandex/i) !== -1)
		const isGoogle = (filterSearchSystem.search(/google/i) !== -1)

		const isTop10 = (filterDeepLevel.search(/top10/i) !== -1)
		const isTop20 = (filterDeepLevel.search(/top20/i) !== -1)
		const isTop30 = (filterDeepLevel.search(/top30/i) !== -1)

		const filter = {
			deleted: false,
			project: filterProject,
			type: (isTop10 ? 10 : (isTop20 ? 20 : 30)),
			region: filterRegion,
		}

		if (filterSearchSystem !== 'all') {
			filter.searchSystem = (isYandex ? 'Yandex' : 'Google')
		}

		if (queryName) {
			filter.searchQuery = queryName
		}

		if (filterDateFrom || filterDateTo) {
			filter.date = {}

			if (filterDateFrom) {
				const date = filterDateFrom
				const day = date.substr(0, 2)
				const month = date.substr(3, 2) - 1
				const year = date.substr(6, 4)

				filter.date['$gte'] = new Date(year, month, day, 0, 0, 0)
			}

			if (filterDateTo) {
				const date = filterDateTo
				const day = date.substr(0, 2)
				const month = date.substr(3, 2) - 1
				const year = date.substr(6, 4)

				filter.date['$lte'] = new Date(year, month, day, 23, 59, 59)
			}
		}

		if (filterDateFrom || filterDateTo || filterSearchSystem === 'all' || filterQuery === 'all') {
			const queryParent = await AnalysisQueries.find(filter).sort([['date', 1]])

			if (queryParent && queryParent.length) {
				const contentQuery = {}

				for (const queryParentItem of queryParent) {
					const date = moment(queryParentItem.date).format('DD.MM.YYYY')

					if (!contentQuery[date]) {
						contentQuery[date] = {
							date: date,
							all: 0,
							positive: 0,
							negative: 0,
							neutral: 0,
							pending: 0,
						}
					}

					const queries = await AnalysisQueriesDetail.find({
						deleted: false,
						query: queryParentItem._id.toString(),
						tonality: {
							$ne: null
						},
					})
						.sort([['position', 1]])
						.populate('category', '_id name')

					if (queries && queries.length) {
						for (const query of queries) {
							if (query.tonality === 'positive') {
								contentQuery[date].positive += 1
								contentQuery[date].all += 1
							} else if (query.tonality === 'negative') {
								contentQuery[date].negative += 1
								contentQuery[date].all += 1
							} else if (query.tonality === 'neutral') {
								contentQuery[date].neutral += 1
								contentQuery[date].all += 1
							} else if (query.tonality === 'pending') {
								contentQuery[date].pending += 1
								contentQuery[date].all += 1
							}
						}
					}
				}

				if (contentQuery && Object.keys(contentQuery).length) {
					for (const i of Object.keys(contentQuery)) {
						content.push(contentQuery[i])
					}
				}
			}
		} else {
			const queryParent = await AnalysisQueries.findOne(filter).sort([['date', -1]])

			if (queryParent) {
				const contentQuery = {
					date: moment(queryParent.date).format('DD.MM.YYYY'),
					all: 0,
					positive: 0,
					negative: 0,
					neutral: 0,
					pending: 0,
				}

				const queries = await AnalysisQueriesDetail.find({
					deleted: false,
					query: queryParent._id.toString(),
					tonality: {
						$ne: null
					},
				})
					.sort([['position', 1]])
					.populate('category', '_id name')

				if (queries && queries.length) {
					for (const query of queries) {
						if (query.tonality === 'positive') {
							contentQuery.positive += 1
							contentQuery.all += 1
						} else if (query.tonality === 'negative') {
							contentQuery.negative += 1
							contentQuery.all += 1
						} else if (query.tonality === 'neutral') {
							contentQuery.neutral += 1
							contentQuery.all += 1
						} else if (query.tonality === 'pending') {
							contentQuery.pending += 1
							contentQuery.all += 1
						}
					}
				}

				content.push(contentQuery)
			}
		}

		res.json({
			status: 'success',
			content: content,
		})
	}
}

module.exports = tonalityList