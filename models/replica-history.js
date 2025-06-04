const {Schema, model} = require('mongoose')

const replicaHistorySchema = new Schema({
	createdBy: {
		type: Schema.Types.ObjectId,
		ref: 'Users',
		required: true,
		default: null,
	},
	createdDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
	deleted: {
		type: Boolean,
		required: true,
		default: false,
	},
	replica: {
		type: Schema.Types.ObjectId,
		ref: 'Replica',
		required: true,
		default: null,
	},
	msg: {
		type: String,
		required: false,
		default: null,
	},
	msgOld: {
		type: String,
		required: false,
		default: null,
	},
	status: {
		type: Schema.Types.ObjectId,
		ref: 'Statuses',
		required: false,
		default: null,
	},
	type: {
		type: Schema.Types.ObjectId,
		ref: 'ReplicaHistoryType',
		required: true,
		default: null,
	},
	log: {
		type: Schema.Types.Mixed,
		required: false,
		default: null,
	},
	sort: {
		type: Number,
		required: true,
		default: 500,
	},
}, {
	collection: 'replica-history'
})

module.exports = model('ReplicaHistory', replicaHistorySchema)