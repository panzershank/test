const {Router}  = require('express')
const Replica = require("../models/replica")
const checkToken = require("../utils/token")
const router = Router()
const statusesList = require('../utils/statuses')

router.get('/', async (req, res) => {
	// const checkTokenResult = await checkToken('tFOBMuwp29A0wT6eUWSZ2d_4sWoN5emZW5W7kTsyaR5whma5dz') || {}
	// const status = statusesList.posted
	//
	// const date = '31.01.2022'
	// const day = date.substr(0, 2)
	// const month = date.substr(3, 2) - 1
	// const year = date.substr(6, 4)
	// const dateFilter = new Date(year, month, day, 23, 59, 59)
	//
	// const replicaAll = await Replica.find({
	// 	company: '60e56e7d62f7820c4ab02bd3',
	// 	status: '5f12dd1fa2585a4b908cb606',
	// 	date: {
	// 		'$lte': dateFilter,
	// 	},
	// })
	// 	.select('date platform url status project company project category screenshot agentName type statusChange')
	// 	.populate('company', 'name')
	// 	.populate('project', 'name')
	// 	.populate('category', 'name')
	// 	.populate('status', 'name code')
	//
	// if (replicaAll.length) {
	// 	const user = checkTokenResult.user
	//
	// 	for (const item of replicaAll) {
	// 		const replica = await Replica.findById(item._id.toString())
	//
	// 		if (replica) {
	// 			replica.modifiedBy = user._id
	// 			replica.modifiedDate = Date.now()
	// 			replica.status = status
	//
	// 			console.log(replica._id)
	//
	// 			await replica.save()
	// 		}
	// 	}
	// }
	
	res.json({
		status: 'success',
	})
})

module.exports = router