/* ==========================================================================
   Экспорт данных для таба "Поисковая выдача"
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const AnalysisQueries = require("../../models/analysis-queries")
const AnalysisQueriesDetail = require("../../models/analysis-queries-detail")
const AnalysisCategory = require("../../models/analysis-category")
const getURL = require("../replica/utils/getUrl")
const XLSX = require('xlsx-js-style')
const moment = require("moment")

const searchListExport = async (req, res) => {
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
		const styleHeader = {
			font: {
				name: "Calibri",
				sz: 12,
				bold: true,
			},
			alignment: {
				horizontal: 'center',
				vertical: 'center',
			},
			fill: {
				fgColor: {
					rgb: "92d050"
				}
			},
		}

		const styleContent = {
			font: {
				name: "Calibri",
				sz: 12,
			},
			alignment: {
				vertical: 'center',
			},
		}

		const styleCenter = {
			font: {
				name: "Calibri",
				sz: 12,
			},
			alignment: {
				horizontal: 'center',
				vertical: 'center',
			},
		}

		const styleEmpty = {
			fill: {
				fgColor: {
					rgb: "ffff00"
				}
			},
		}

		const content = [
			[
				{v: "Информация", t: "s", s: styleHeader},
				{v: "Позиция", t: "s", s: styleHeader},
				{v: "URL", t: "s", s: styleHeader},
				{v: "Title", t: "s", s: styleHeader},
				{v: "Description", t: "s", s: styleHeader},
				{v: "Рейтинг", t: "s", s: styleHeader},
				{v: "Динамика изменения", t: "s", s: styleHeader},
				{v: "Тональность", t: "s", s: styleHeader},
				{v: "Тип площадки", t: "s", s: styleHeader},
			]
		]

		const contentPrev = []


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
					let row = 1

					for (const query of queries) {
						const domain = (query.url && getURL(query.url) ? getURL(query.url) : '')
						const positionOld = (contentPrev && contentPrev.length ? contentPrev.find(i => i.url === query.url) : null)

						let change = ''
						let changeType = ''
						let tonalityName = ''
						let infoText = ''

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

						if (query.tonality) {
							if (query.tonality === 'positive') {
								tonalityName = 'Позитив'
							} else if (query.tonality === 'negative') {
								tonalityName = 'Негатив'
							} else if (query.tonality === 'pending') {
								tonalityName = 'Управляемое'
							} else if (query.tonality === 'neutral') {
								tonalityName = 'Нерелевант'
							}
						}

						if (row === 1) {
							infoText = (queryParent.date ? moment(queryParent.date).format('DD.MM.YYYY') : '')
						} else if (row === 2) {
							infoText = (queryParent.searchQuery ? queryParent.searchQuery : '')
						} else if (row === 3 && queryParent.searchSystem) {
							if (queryParent.searchSystem === 'Yandex') {
								infoText = 'Яндекс'
							} else if (queryParent.searchSystem === 'Google') {
								infoText = 'Google'
							} else {
								infoText = ''
							}
						} else if (row === 4) {
							infoText = (queryParent.region ? queryParent.region : '')
						} else if (row === 5 && queryParent.type) {
							if (queryParent.type === 10) {
								infoText = 'ТОП 10'
							} else if (queryParent.type === 20) {
								infoText = 'ТОП 20'
							} else if (queryParent.type === 30) {
								infoText = 'ТОП 30'
							} else {
								infoText = ''
							}
						}

						content.push([
							{v: (infoText ? infoText : ''), t: "s", s: styleCenter},
							{v: (query.position ? query.position : ''), t: "s", s: styleContent},
							{v: (query.url ? query.url : ''), t: "s", s: styleContent},
							{v: (query.title ? query.title : ''), t: "s", s: styleContent},
							{v: (query.description ? query.description : ''), t: "s", s: styleContent},
							{v: (query.rating ? query.rating.toFixed(2) : '0'), t: "s", s: styleContent},
							{v: (change ? change : ''), t: "s", s: styleContent},
							{v: (tonalityName ? tonalityName : ''), t: "s", s: styleContent},
							{v: (query.category && query.category.name ? query.category.name : ''), t: "s", s: styleContent},
						])

						row++
					}

					content.push([
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
						{v: "", t: "s", s: styleEmpty},
					])
				}
			}
		}

		const ws = XLSX.utils.aoa_to_sheet(content)
		const wb = XLSX.utils.book_new()

		ws['!rows'] = [
			{hpx: 30.75},
		]

		ws['!cols'] = [
			{wpx: 110 / 1.15},
			{wpx: 100 / 1.15},
			{wpx: 487 / 1.15},
			{wpx: 361 / 1.15},
			{wpx: 361 / 1.15},
			{wpx: 89 / 1.15},
			{wpx: 200 / 1.15},
			{wpx: 200 / 1.15},
			{wpx: 200 / 1.15},
		]

		XLSX.utils.book_append_sheet(wb, ws, "Поисковая выдача")

		const buf = XLSX.write(wb, {type: 'buffer', bookType: "xlsx"})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader("Content-Disposition", "attachment; filename=Poiskovaya_vidacha.xlsx")
		res.status(200).send(buf)
	}
}

module.exports = searchListExport