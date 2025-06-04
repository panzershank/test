/* ==========================================================================
   Создаем запись в истории логирования реплик
   ========================================================================== */

const Replica = require("../../../models/replica")
const ReplicaMsg = require("../../../models/replica-msg")
const ReplicaFields = require("../../../models/replica-fields")
const ReplicaHistory = require("../../../models/replica-history")
const Statuses = require("../../../models/statuses")
const statusesList = require("../../../utils/statuses")
const Projects = require("../../../models/projects")

const addReplicaHistory = async (params) => {
	if (params.id && params.userId) {
		let add = true

		if (params.status && params.status.toString() && params.status.toString() === statusesList.created) {
			add = false
		}

		if (add) {
			let sort = 100

			const log = {
				replica: null,
				replicaMsg: null,
				replicaFields: null,
			}

			const replica = await Replica.findOne({
				_id: params.id.toString(),
			})

			if (replica && replica._id) {
				log.replica = replica

				const replicaMsg = await ReplicaMsg.findOne({
					replica: replica._id,
					deleted: false,
				}).sort([['createdDate', -1]])

				if (replicaMsg) {
					log.replicaMsg = replicaMsg
				}

				const replicaFields = await ReplicaFields.find({
					replica: replica._id,
					deleted: false,
				}).sort([['createdDate', -1]])

				if (replicaFields) {
					log.replicaFields = replicaFields
				}

				if (replica.project && replica.project.toString()) {
					const projects = await Projects.findOne({
						_id: replica.project.toString(),
					})

					if (projects && projects._id) {
						projects.changes = true
						await projects.save()
					}
				}
			}

			const history = await ReplicaHistory.findOne({
				replica: replica._id,
			}).sort([['sort', -1]])

			if (history && history._id && history.sort) {
				sort = history.sort + 100
			}

			const replicaHistory = new ReplicaHistory({
				createdBy: params.userId.toString(),
				createdDate: Date.now(),
				deleted: false,
				replica: params.id.toString(),
				msg: (params.msg ? params.msg : ''),
				msgOld: (params.msgOld ? params.msgOld : ''),
				status: (params.status && params.status.toString() ? params.status.toString() : null),
				type: (params.type && params.type.toString() ? params.type.toString() : null),
				log: log,
				sort: sort,
			})

			await replicaHistory.save()
		}
	}

	// Вывод рекурсивного популейта
	// const history = await ReplicaHistory.findOne({
	// 	replica: params.id.toString(),
	// }).populate({path: 'log.replica.status', model: Statuses})
	//
	// console.log(history.log.replica)
}

module.exports = addReplicaHistory