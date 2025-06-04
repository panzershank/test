/* ==========================================================================
   Выбор данных для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueries = require("../../models/analysis-queries")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")
const AnalysisCategory = require("../../models/analysis-category")
const getURL = require("../replica/utils/getUrl")
const searchList = async (req, res) => {
	const errors = []
	const data = await checkToken(req.query.token)
	const filterQuery = (req.query.query && req.query.query.length === 24 ? req.query.query : '')
	const filterDateFrom = (req.query.dateFrom ? req.query.dateFrom : '')
	const filterDateTo = (req.query.dateTo ? req.query.dateTo : '')

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!filterQuery) {
		errors.push('Поисковый запрос не найден')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const categories = []
		const content = []
		const contentPrev = []


		// Список категорий для селекта
		const categoriesList = await AnalysisCategory.find({
			deleted: false,
		}).sort([['sort', 1]])

		if (categoriesList && categoriesList.length) {
			for (const category of categoriesList) {
				categories.push({
					value: category._id.toString(),
					label: category.name,
				})
			}
		}


		// Выбираем данные о запросе
		const queryParentFirst = await AnalysisQueries.findOne({
			deleted: false,
			_id: filterQuery,
		})

		if (queryParentFirst) {
			const filter = {
				deleted: false,
				region: queryParentFirst.region,
				searchQuery: queryParentFirst.searchQuery,
				searchSystem: queryParentFirst.searchSystem,
				type: queryParentFirst.type,
				project: queryParentFirst.project._id.toString(),
			}

			const filterPrev = {...filter}

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

					filterPrev.date = {}
					filterPrev.date['$lte'] = new Date(year, month, day, 23, 59, 59)
				}
			}

			const queryParent = await AnalysisQueries.findOne(filter).sort([['date', -1]])

			if (queryParent) {
				// Выбираем данные по предыдущим данным
				let queryPrevAdd = false
				let queryPrevId = null

				const queriesParent = await AnalysisQueries.find(filterPrev)
					.sort([['date', -1]])
					.select('date _id')

				for (const query of queriesParent) {
					if (queryPrevAdd) {
						queryPrevId = query._id.toString()
						break
					}

					queryPrevAdd = true
				}

				if (queryPrevId) {
					const queries = await AnalysisQueriesDetail.find({
						deleted: false,
						query: queryPrevId,
					}).select('position url')

					if (queries && queries.length) {
						for (const query of queries) {
							contentPrev.push({
								url: query.url,
								position: query.position,
							})
						}
					}
				}


				// Выбираем актуальные данные
				const queries = await AnalysisQueriesDetail.find({
					deleted: false,
					query: queryParent._id.toString(),
				})
					.sort([['position', 1]])
					.populate('category', '_id name')

				if (queries && queries.length) {
					for (const query of queries) {
						const domain = (query.url && getURL(query.url) ? getURL(query.url) : '')
						const positionOld = (contentPrev && contentPrev.length ? contentPrev.find(i => i.url === query.url) : null)
						let change = ''
						let changeType = ''

						if (!positionOld) {
							change = 'N/A'
							changeType = 'pending'
						} else if (positionOld.position === query.position) {
							change = '-'
							changeType = 'neutral'
						} else if (positionOld.position > query.position) {
							change = `+${positionOld.position - query.position}`
							changeType = 'positive'
						} else if (positionOld.position < query.position) {
							change = `-${query.position - positionOld.position}`
							changeType = 'negative'
						}

						content.push({
							id: query._id.toString(),
							change: change,
							changeType: changeType,
							url: domain,
							urlFull: query.url,
							info: {
								title: query.title,
								text: query.description,
								rating: (query.rating ? query.rating.toFixed(2) : 0),
							},
							position: (query.position ? query.position : ''),
							positionOld: (positionOld ? positionOld.position : null),
							tonality: (query.tonality ? query.tonality : ''),
							category: (query.category && query.category.name ? {
								id: query.category._id.toString(),
								name: query.category.name,
							} : false),
						})
					}
				}
			}
		}

		res.json({
			status: 'success',
			content: content,
			categories: categories,
		})
	}
}

module.exports = searchList
