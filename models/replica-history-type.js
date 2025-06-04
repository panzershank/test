const {Schema, model} = require('mongoose')

const replicaHistoryTypeSchema = new Schema({
	name: {
		type: String,
		required: true,
		default: null,
	},
	code: {
		type: String,
		required: true,
		default: null,
	},
	sort: {
		type: Number,
		required: true,
		default: 500,
	},
}, {
	collection: 'replica-history-type'
})

module.exports = model('ReplicaHistoryType', replicaHistoryTypeSchema)