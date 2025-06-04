/* ==========================================================================
   Получение плана для проекта
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Plan = require("../../models/plan")
const PlanDetail = require("../../models/plan-detail")
const Replica = require("../../models/replica")
const moment = require("moment")
const statusesList = require('../../utils/statuses')

const getPlan = async (req, res) => {
	const errors = []
	const checkTokenResult = await checkToken(req.query.token) || {}

	if (checkTokenResult.status === 'fail') {
		errors.push(checkTokenResult.errorText)
	}

	if (!req.query.project) {
		errors.push('Проект не выбран')
	} else if (req.query.project.length !== 24) {
		errors.push('ID проекта указано с ошибкой')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const planPrint = []


		// Выбираем список реплик проекта
		const replica = []

		const arrReplica = await Replica.find({
			deleted: false,
			project: req.query.project,
		}).select('date platform status')

		if (arrReplica && arrReplica.length) {
			for (const item of arrReplica) {
				replica.push({
					domain: item.platform,
					date: item.date,
					status: item.status.toString(),
				})
			}
		}


		const arrPlan = await Plan.find({
			deleted: false,
			project: req.query.project,
		}).sort([['dateFrom', 1]])

		if (arrPlan && arrPlan.length) {
			const arrRemainderPrev = {}
			let counter = 1
			let randomId = 1

			for (const plan of arrPlan) {
				if (plan.dateFrom && plan.dateTo) {
					const info = {
						id: plan._id.toString(),
						rowNumber: counter,
						dateStart: moment(plan.dateFrom).format('DD.MM.YYYY'),
						dateEnd: moment(plan.dateTo).format('DD.MM.YYYY'),
						remainsOld: 0,
						needed: 0,
						remains: 0,
						used: 0,
						agreed: 0,
						posted: 0,
						sites: [],
						isOpen: false,
					}

					const arrPlanDetail = await PlanDetail.find({
						plan: info.id,
						deleted: false,
					})

					if (arrPlanDetail && arrPlanDetail.length) {
						for (const planDetail of arrPlanDetail) {
							if (planDetail.domain) {
								const infoDetail = {
									id: planDetail._id.toString(),
									name: planDetail.domain,
									remainsOld: 0,
									needed: 0,
									remains: 0,
									used: 0,
									agreed: 0,
									posted: 0,
								}

								if (!arrRemainderPrev[planDetail.domain]) {
									// if (planDetail.remainderPrev && counter === 1) {
									if (planDetail.remainderPrev) {
										arrRemainderPrev[planDetail.domain] = planDetail.remainderPrev
									} else {
										arrRemainderPrev[planDetail.domain] = 0
									}
								}

								for (const item of replica) {
									const date = moment(item.date).unix()
									const dateFrom = moment(plan.dateFrom).unix()
									const dateTo = moment(plan.dateTo).unix()

									if (date >= dateFrom && date <= dateTo && item.domain === planDetail.domain) {
										// Написано
										if (
											item.status === statusesList.created ||
											item.status === statusesList.waiting ||
											item.status === statusesList.posting ||
											item.status === statusesList.moderation ||
											item.status === statusesList.posted ||
											item.status === statusesList.refused
										) {
											infoDetail.used += 1
											info.used += 1
										}

										// Согласовано
										if (
											item.status === statusesList.posting ||
											item.status === statusesList.moderation ||
											item.status === statusesList.posted
										) {
											infoDetail.agreed += 1
											info.agreed += 1
										}

										// Размещено
										if (item.status === statusesList.posted) {
											infoDetail.posted += 1
											info.posted += 1
										}
									}
								}

								// Остаток предыдущего периода
								infoDetail.remainsOld += (arrRemainderPrev[planDetail.domain] ? arrRemainderPrev[planDetail.domain] : 0)
								info.remainsOld += (arrRemainderPrev[planDetail.domain] ? arrRemainderPrev[planDetail.domain] : 0)

								// if (planDetail.remainderPrev && parseInt(planDetail.remainderPrev)) {
								// 	infoDetail.remainsOld = parseInt(planDetail.remainderPrev)
								// 	info.remainsOld += parseInt(planDetail.remainderPrev)
								// }

								// Требуется
								if (planDetail.replicaRequired && parseInt(planDetail.replicaRequired)) {
									infoDetail.needed = parseInt(planDetail.replicaRequired)
									info.needed += parseInt(planDetail.replicaRequired)
								}

								// Остаток
								if (planDetail.remainder && parseInt(planDetail.remainder)) {
									infoDetail.remains = parseInt(planDetail.remainder)
									info.remains += parseInt(planDetail.remainder)
								} else {
									infoDetail.remains = infoDetail.remainsOld + infoDetail.needed - infoDetail.posted
									info.remains = infoDetail.remainsOld + infoDetail.needed - infoDetail.posted
								}

								arrRemainderPrev[planDetail.domain] = infoDetail.remains

								info.sites.push(infoDetail)
							}
						}
					} else {
						info.sites.push({
							id: randomId,
							name: '',
							remainsOld: 0,
							needed: 0,
							remains: 0,
							used: 0,
							agreed: 0,
							posted: 0,
						})

						randomId++
					}

					planPrint.push(info)
					counter++
				}
			}
		}

		res.json({
			status: 'success',
			plan: planPrint,
		})
	}
}

module.exports = getPlan