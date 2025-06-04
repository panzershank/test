/* ==========================================================================
   Выбор данных для таба "Анализ рейтинга площадок"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueries = require("../../models/analysis-queries")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")
const AnalysisCategory = require("../../models/analysis-category")
const Replica = require("../../models/replica")
const getURL = require("../replica/utils/getUrl")
const numberFormat = require("../../utils/number-format")
const statusesList = require("../../utils/statuses")
const AnalysisComments = require("../../models/analysis-comments")
const moment = require("moment")

const ratingList = async (req, res) => {
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
		const content = []
		const contentPrev = []
		const contentGraph = []

		let ratingPrev = 0
		let ratingCountPrev = 0
		let ratingTotalPrev = 0

		let ratingNew = 0
		let ratingCountNew = 0
		let ratingTotalNew = 0


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

			const queryParent = await AnalysisQueries.findOne(filter).sort([['date', -1]])

			if (queryParent) {
				// Выбираем данные по предыдущим данным
				let queryPrevAdd = false
				let queryPrevId = null

				const queriesParent = await AnalysisQueries.find(filter)
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
					}).select('position url rating')

					if (queries && queries.length) {
						for (const query of queries) {
							const rating = parseFloat(query.rating ? query.rating : 0)

							contentPrev.push({
								url: query.url,
								position: query.position,
								rating: rating,
							})

							if (rating) {
								ratingCountPrev += 1
								ratingTotalPrev += rating
							}
						}
					}
				}

				if (ratingCountPrev) {
					ratingPrev = parseFloat(ratingTotalPrev.toFixed(2)) / ratingCountPrev
					ratingPrev = parseFloat(ratingPrev.toFixed(2))
				}


				// Список завершенных реплик проекта
				const replicaCountAll = {}

				const replica = await Replica.find({
					deleted: false,
					project: queryParentFirst.project._id.toString(),
					status: statusesList.posted,
				}, {_id: 1})
					.select('_id category url')
					.populate('category', '_id name')
					.lean()

				if (replica && replica.length) {
					for (const item of replica) {
						if (item.category && item.category._id && item.url && (item.category._id.toString() === '5f20587ad5378556248bff40' || item.category._id.toString() === '5f205882d5378556248bff41')) {
							if (!replicaCountAll[item.url]) {
								replicaCountAll[item.url] = {
									representative: 0,
									agent: 0,
									all: 0,
								}
							}

							if (item.category._id.toString() === '5f20587ad5378556248bff40') {
								replicaCountAll[item.url].representative += 1
								replicaCountAll[item.url].all += 1
							} else if (item.category._id.toString() === '5f205882d5378556248bff41') {
								replicaCountAll[item.url].agent += 1
								replicaCountAll[item.url].all += 1
							}
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
						const rating = parseFloat(query.rating ? query.rating : 0)
						const domain = (query.url && getURL(query.url) ? getURL(query.url) : '')
						const dataOld = (contentPrev && contentPrev.length ? contentPrev.find(i => i.url === query.url) : null)
						const comments = []

						let typeChange = ''
						let replicaCount = (replicaCountAll && replicaCountAll[query.url] ? replicaCountAll[query.url] : null)
						let tonality = ''
						let ratingChange = ''

						if (rating) {
							ratingCountNew += 1
							ratingTotalNew += rating
						}

						if (rating && dataOld && dataOld.rating) {
							if (rating === dataOld.rating) {
								ratingChange = 'neutral'
							} else if (rating > dataOld.rating) {
								ratingChange = 'positive'
							} else if (rating < dataOld.rating) {
								ratingChange = 'negative'
							}
						} else {
							ratingChange = 'neutral'
						}

						if (query.tonality) {
							if (query.tonality === 'positive') {
								tonality = 'Позитив'
								typeChange = 'positive'
							} else if (query.tonality === 'negative') {
								tonality = 'Негатив'
								typeChange = 'negative'
							} else if (query.tonality === 'pending') {
								tonality = 'Управляемое'
								typeChange = 'pending'
							} else if (query.tonality === 'neutral') {
								tonality = 'Нерелевант'
								typeChange = 'neutral'
							}
						}


						// Собираем комментарии
						const commentsQuery = await AnalysisComments.find({
							deleted: false,
							url: query.url,
							project: queryParent.project._id.toString(),
						}).sort([['date', 1]])

						if (commentsQuery && commentsQuery.length) {
							for (const comment of commentsQuery) {
								comments.push({
									id: comment._id.toString(),
									date: (comment.date ? moment(comment.date).format('DD.MM.YYYY') : ''),
									name: (comment.authorName ? comment.authorName : ''),
									text: (comment.text ? comment.text : ''),
								})
							}
						}


						content.push({
							id: query._id.toString(),
							url: domain,
							urlFull: query.url,
							type: (query.category && query.category.name ? query.category.name : ''),
							quantity: (replicaCount && replicaCount.all ? numberFormat(replicaCount.all, 0, '.', ' ') : '0'),
							rating: rating.toFixed(2),
							ratingChange: ratingChange,
							typeChange: typeChange,
							info: {
								tonality: tonality,
								tonalityCode: (query.tonality ? query.tonality : ''),
								representative: (replicaCount && replicaCount.representative ? numberFormat(replicaCount.representative, 0, '.', ' ') : '0'),
								agent: (replicaCount && replicaCount.agent ? numberFormat(replicaCount.agent, 0, '.', ' ') : '0'),
							},
							comments: comments,
						})
					}
				}

				if (ratingCountNew) {
					ratingNew = parseFloat(ratingTotalNew.toFixed(2)) / ratingCountNew
					ratingNew = parseFloat(ratingNew.toFixed(2))
				}
			}
		}


		// График
		if (filterDateFrom && filterDateTo) {
			const queryParentFirstGraph = await AnalysisQueries.findOne({
				deleted: false,
				_id: filterQuery,
			})

			if (queryParentFirstGraph) {
				const filter = {
					deleted: false,
					project: queryParentFirstGraph.project._id.toString(),
					date: {},
					searchSystem: queryParentFirstGraph.searchSystem,
					searchQuery: queryParentFirstGraph.searchQuery,
					region: queryParentFirstGraph.region,
					type: queryParentFirstGraph.type,
				}

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

				const queryParent = await AnalysisQueries.find(filter).sort([['date', 1]])

				if (queryParent && queryParent.length) {
					const contentQuery = {}

					for (const queryParentItem of queryParent) {
						const date = moment(queryParentItem.date).format('DD.MM.YYYY')

						if (!contentQuery[date]) {
							contentQuery[date] = {
								date: date,
								positive: 0,
								positiveAll: 0,
								negative: 0,
								negativeAll: 0,
								neutral: 0,
								neutralAll: 0,
								pending: 0,
								pendingAll: 0,
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
							.select('_id rating tonality')

						if (queries && queries.length) {
							for (const query of queries) {
								if (query.rating && query.rating > 0 && query.tonality) {
									if (query.tonality === 'positive') {
										contentQuery[date].positive += parseFloat(query.rating)
										contentQuery[date].positiveAll += 1
									} else if (query.tonality === 'negative') {
										contentQuery[date].negative += parseFloat(query.rating)
										contentQuery[date].negativeAll += 1
									} else if (query.tonality === 'neutral') {
										contentQuery[date].neutral += parseFloat(query.rating)
										contentQuery[date].neutralAll += 1
									} else if (query.tonality === 'pending') {
										contentQuery[date].pending += parseFloat(query.rating)
										contentQuery[date].pendingAll += 1
									}
								}
							}
						}
					}

					if (contentQuery && Object.keys(contentQuery).length) {
						for (const i of Object.keys(contentQuery)) {
							const item = {...contentQuery[i]}

							if (item.positiveAll) {
								item.positive = parseFloat(item.positive / item.positiveAll).toFixed(2)
							}

							if (item.negativeAll) {
								item.negative = parseFloat(item.negative / item.negativeAll).toFixed(2)
							}

							if (item.neutralAll) {
								item.neutral = parseFloat(item.neutral / item.neutralAll).toFixed(2)
							}

							if (item.pendingAll) {
								item.pending = parseFloat(item.pending / item.pendingAll).toFixed(2)
							}

							delete item.positiveAll
							delete item.negativeAll
							delete item.neutralAll
							delete item.pendingAll

							contentGraph.push(item)
						}
					}
				}
			}
		}


		res.json({
			status: 'success',
			rating: (ratingNew ? ratingNew : null),
			ratingOld: (ratingPrev ? ratingPrev : null),
			contentGraph: (contentGraph && contentGraph.length > 1 ? contentGraph : []),
			content: content,
		})
	}
}

module.exports = ratingList