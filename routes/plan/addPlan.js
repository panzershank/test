/* ==========================================================================
   Создание и редактирование плана
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Plan = require("../../models/plan")
const PlanDetail = require("../../models/plan-detail")
const getURL = require("../replica/utils/getUrl")

const updateReplica = async (req, res) => {
	const errors = []
	const checkTokenResult = await checkToken(req.body.token) || {}

	if (checkTokenResult.status === 'fail') {
		errors.push(checkTokenResult.errorText)
	}

	if (!req.body.project) {
		errors.push('Проект не выбран')
	}

	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const data = (req.body.data ? JSON.parse(req.body.data) : [])
		const user = checkTokenResult.user


		// Выбираем текущий план проекта
		const arrPlan = {}
		const arrPlanDetailFewDelete = []

		const planProject = await Plan.find({
			project: req.body.project,
			deleted: false,
		})

		if (planProject) {
			for (const plan of planProject) {
				arrPlan[plan._id.toString()] = {}

				const planDetailProject = await PlanDetail.find({
					plan: plan._id.toString(),
					deleted: false,
				})

				if (planDetailProject) {
					for (const planDetail of planDetailProject) {
						arrPlan[plan._id.toString()][planDetail._id.toString()] = planDetail._id.toString()
					}
				}
			}
		}


		// Перебираем данные, которые пришли с фронта
		// Добавляем новый план, либо редактируем текущий
		if (data && data.length) {
			for (const item of data) {
				if (item.dateStart && item.dateEnd) {
					const arrDateFrom = item.dateStart.split('.')
					const dateFrom = new Date(arrDateFrom[2], arrDateFrom[1] - 1, arrDateFrom[0])

					const arrDateTo = item.dateEnd.split('.')
					const dateTo = new Date(arrDateTo[2], arrDateTo[1] - 1, arrDateTo[0])

					let update = false

					if (item.id) {
						// Изменяем текущий план
						let planUpdate = {}

						if (item.id.length === 24) {
							planUpdate = await Plan.findOne({_id: item.id})
						}

						if (planUpdate && planUpdate._id && planUpdate._id.toString()) {
							update = true

							planUpdate.modifiedBy = user._id.toString()
							planUpdate.modifiedDate = Date.now()
							planUpdate.dateFrom = dateFrom.getTime()
							planUpdate.dateTo = dateTo.getTime()

							await planUpdate.save()

							if (item.sites && item.sites.length) {
								for (const itemDetail of item.sites) {
									const domain = (itemDetail.name && getURL(itemDetail.name) ? getURL(itemDetail.name) : false)

									if (domain) {
										let updateDetail = false

										if (itemDetail.id) {
											let planDetailUpdate = {}

											if (itemDetail.id.length === 24) {
												planDetailUpdate = await PlanDetail.findOne({_id: itemDetail.id})
											}

											if (planDetailUpdate && planDetailUpdate._id && planDetailUpdate._id.toString()) {
												updateDetail = true

												planDetailUpdate.modifiedBy = user._id.toString()
												planDetailUpdate.modifiedDate = Date.now()
												planDetailUpdate.domain = domain
												planDetailUpdate.remainderPrev = (itemDetail.remainsOld && parseInt(itemDetail.remainsOld) ? parseInt(itemDetail.remainsOld) : 0)
												planDetailUpdate.replicaRequired = (itemDetail.needed && parseInt(itemDetail.needed) ? parseInt(itemDetail.needed) : 0)
												planDetailUpdate.remainder = (itemDetail.remains && parseInt(itemDetail.remains) ? parseInt(itemDetail.remains) : 0)

												await planDetailUpdate.save()
											}

											if (arrPlan[item.id][itemDetail.id]) {
												delete arrPlan[item.id][itemDetail.id]
											}
										}

										if (!updateDetail) {
											const planDetail = new PlanDetail({
												createdBy: user._id.toString(),
												createdDate: Date.now(),
												deleted: false,
												plan: item.id,
												domain: domain,
												remainderPrev: (itemDetail.remainsOld && parseInt(itemDetail.remainsOld) ? parseInt(itemDetail.remainsOld) : 0),
												replicaRequired: (itemDetail.needed && parseInt(itemDetail.needed) ? parseInt(itemDetail.needed) : 0),
												remainder: (itemDetail.remains && parseInt(itemDetail.remains) ? parseInt(itemDetail.remains) : 0),
											})

											await planDetail.save()
										}
									}
								}
							}

							if (arrPlan[item.id]) {
								if (arrPlan[item.id] && Object.keys(arrPlan[item.id]).length) {
									for (const planDetailDelete of Object.keys(arrPlan[item.id])) {
										arrPlanDetailFewDelete.push(planDetailDelete)
									}
								}

								delete arrPlan[item.id]
							}
						}
					}

					if (!update) {
						// Создаем новый план
						const plan = new Plan({
							createdBy: user._id.toString(),
							createdDate: Date.now(),
							deleted: false,
							project: req.body.project,
							dateFrom: dateFrom.getTime(),
							dateTo: dateTo.getTime(),
						})

						const planNew = await plan.save()
						const planId = planNew._id.toString()

						if (planId && item.sites && item.sites.length) {
							for (const itemDetail of item.sites) {
								const domain = (itemDetail.name && getURL(itemDetail.name) ? getURL(itemDetail.name) : false)

								if (domain) {
									const planDetail = new PlanDetail({
										createdBy: user._id.toString(),
										createdDate: Date.now(),
										deleted: false,
										plan: planId,
										domain: domain,
										remainderPrev: (itemDetail.remainsOld && parseInt(itemDetail.remainsOld) ? parseInt(itemDetail.remainsOld) : 0),
										replicaRequired: (itemDetail.needed && parseInt(itemDetail.needed) ? parseInt(itemDetail.needed) : 0),
										remainder: (itemDetail.remains && parseInt(itemDetail.remains) ? parseInt(itemDetail.remains) : 0),
									})

									await planDetail.save()
								}
							}
						}
					}
				}
			}
		}


		// Удаляем план, который не вошел в редактирование
		if (arrPlan && Object.keys(arrPlan).length) {
			const arrPlanDelete = []
			const arrPlanDetailDelete = []

			for (const plan of Object.keys(arrPlan)) {
				if (arrPlan[plan] && Object.keys(arrPlan[plan]).length) {
					for (const planDetail of Object.keys(arrPlan[plan])) {
						arrPlanDetailDelete.push(planDetail)
					}
				}

				arrPlanDelete.push(plan)
			}

			if (arrPlanDelete.length) {
				const planProject = await Plan.find({_id: arrPlanDelete})

				if (planProject) {
					for (const plan of planProject) {
						plan.modifiedBy = user._id.toString()
						plan.modifiedDate = Date.now()
						plan.deleted = true

						await plan.save()
					}
				}
			}

			if (arrPlanDetailDelete.length) {
				const planDetailProject = await PlanDetail.find({_id: arrPlanDetailDelete})

				if (planDetailProject) {
					for (const planDetail of planDetailProject) {
						planDetail.deleted = true
						await planDetail.save()
					}
				}
			}
		}

		if (arrPlanDetailFewDelete && arrPlanDetailFewDelete.length) {
			const planDetailProject = await PlanDetail.find({_id: arrPlanDetailFewDelete})

			if (planDetailProject) {
				for (const planDetail of planDetailProject) {
					planDetail.deleted = true
					await planDetail.save()
				}
			}
		}


		res.json({
			status: 'success',
		})
	}
}

module.exports = updateReplica