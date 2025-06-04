/* ==========================================================================
   Создание поисковых запросов
   ========================================================================== */

const AnalysisQueries = require("../../models/analysis-queries")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")

const queries = async (req, res) => {
	const errors = []
	const data = await checkToken(req.body.token)
	const projectId = req.body.project

	if (data.status === 'fail') {
		errors.push(data.errorText)
	}

	if (!projectId) {
		errors.push('Проект не найден')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const user = data.user
		const queries = (req.body.data ? JSON.parse(req.body.data) : [])

		if (queries && queries.length) {
			for (const query of queries) {
				if (query.date && query.searchQuery && query.searchSystem && query.type && query.region) {
					const arrDate = query.date.split('.')
					const date = new Date(arrDate[2], arrDate[1] - 1, arrDate[0])

					const isTop10 = (query.type.search(/Топ 10/i) !== -1)
					const isTop20 = (query.type.search(/Топ 20/i) !== -1)
					const isTop30 = (query.type.search(/Топ 30/i) !== -1)

					const isYandex = (query.searchSystem.search(/Яндекс/i) !== -1 || query.searchSystem.search(/Yandex/i) !== -1)
					const isGoogle = (query.searchSystem.search(/Google/i) !== -1)

					if (date && date.getTime() && (isTop10 || isTop20 || isTop30) && (isYandex || isGoogle) && query.data && query.data.length) {
						const analysisQueriesOld = await AnalysisQueries.find({
							deleted: false,
							project: projectId,
							date: date.getTime(),
							searchQuery: query.searchQuery,
							searchSystem: (isYandex ? 'Yandex' : 'Google'),
							type: (isTop10 ? 10 : (isTop20 ? 20 : 30)),
							region: query.region,
						})

						if (analysisQueriesOld && analysisQueriesOld.length) {
							for (const queryOld of analysisQueriesOld) {
								queryOld.deleted = true
								queryOld.modifiedBy = user._id
								queryOld.modifiedDate = Date.now()

								await queryOld.save()

								const analysisQueriesDetailOld = await AnalysisQueriesDetail.find({
									query: queryOld._id.toString(),
									deleted: false,
								})

								if (analysisQueriesDetailOld && analysisQueriesDetailOld.length) {
									for (const queryDetailOld of analysisQueriesDetailOld) {
										queryDetailOld.deleted = true
										queryDetailOld.modifiedBy = user._id
										queryDetailOld.modifiedDate = Date.now()

										await queryDetailOld.save()
									}
								}
							}
						}

						const analysisQueries = new AnalysisQueries({
							createdBy: user._id.toString(),
							createdDate: Date.now(),
							deleted: false,
							project: projectId,
							date: date.getTime(),
							searchQuery: query.searchQuery,
							searchSystem: (isYandex ? 'Yandex' : 'Google'),
							type: (isTop10 ? 10 : (isTop20 ? 20 : 30)),
							region: query.region,
							frequency: (query.frequency ? query.frequency : 0),
						})

						const analysisQueriesNew = await analysisQueries.save()
						const queryId = analysisQueriesNew._id.toString()

						if (queryId) {
							for (const queryDetail of query.data) {
								const analysisQueriesDetail = new AnalysisQueriesDetail({
									createdBy: user._id.toString(),
									createdDate: Date.now(),
									deleted: false,
									query: queryId,
									position: (queryDetail.position ? parseInt(queryDetail.position) : null),
									url: (queryDetail.url ? queryDetail.url : null),
									title: (queryDetail.title ? queryDetail.title : null),
									description: (queryDetail.description ? queryDetail.description : null),
									rating: (queryDetail.rating ? parseFloat(queryDetail.rating.replace(/,/g, '.')) : null),
									tonality: null,
									category: null,
								})

								await analysisQueriesDetail.save()
							}
						}
					}
				}
			}
		}

		res.json({
			status: 'success',
		})
	}
}

module.exports = queries