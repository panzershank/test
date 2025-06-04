const Replica = require("../models/replica")
const Plan = require("../models/plan")
const PlanDetail = require("../models/plan-detail")
const moment = require("moment")
const getURL = require("../routes/replica/utils/getUrl")

const addReplicaToPlan = async (user, replicaId) => {
	if (user && user._id && user._id.toString() && replicaId && replicaId.toString()) {
		const replica = await Replica.findOne({
			_id: replicaId.toString(),
		})

		if (replica && replica.project && replica.project.toString()) {
			const planFilter = {
				deleted: false,
				project: replica.project.toString(),
			}

			if (replica.type && (replica.type === 1 || replica.type === 2)) {
				planFilter.type = replica.type
			} else {
				planFilter.type = null
			}

			const arrPlan = await Plan.find(planFilter)

	        if (arrPlan && arrPlan.length) {
		        for (const plan of arrPlan) {
			        const date = moment(replica.date).unix()
					const dateFrom = moment(plan.dateFrom).unix()
					const dateTo = moment(plan.dateTo).unix()

			        if (date >= dateFrom && date <= (dateTo + (60 * 60 * 24) - 1)) {
				        const planDetail = await PlanDetail.findOne({
	                        plan: plan._id.toString(),
	                        deleted: false,
					        url: replica.url
	                    })

	                    if (!planDetail) {
		                    const domain = (replica.url && getURL(replica.url) ? getURL(replica.url) : false)

		                    if (domain) {
			                    const planDetailNew = new PlanDetail({
				                    createdBy: user._id.toString(),
				                    createdDate: Date.now(),
				                    deleted: false,
				                    plan: plan._id.toString(),
				                    domain: domain,
				                    url: (replica.url ? replica.url : null),
				                    remainderPrev: 0,
				                    replicaRequired: 0,
				                    remainder: 0,
			                    })

			                    await planDetailNew.save()
		                    }
					    }
			        }
		        }
	        }
		}
	}
}

module.exports = addReplicaToPlan