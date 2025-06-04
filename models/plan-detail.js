const {Schema, model} = require('mongoose')

const PlanDetailSchema = new Schema({
	createdBy: {
		type: Schema.Types.ObjectId,
		ref: 'Users',
		required: true,
		default: null,
	},
	modifiedBy: {
		type: Schema.Types.ObjectId,
		ref: 'Users',
		required: false,
		default: null,
	},
	createdDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
	modifiedDate: {
		type: Date,
		required: false,
		default: null,
	},
	deleted: {
		type: Boolean,
		required: true,
		default: false,
	},
	plan: {
		type: Schema.Types.ObjectId,
		ref: 'Plan',
		required: true,
		default: null,
	},
	domain: {
		type: String,
		required: true,
		default: null,
	},
	url: {
		type: String,
		required: false,
		default: null,
	},
	remainderPrev: {
		type: Number,
		required: false,
		default: null,
	},
	replicaRequired: {
		type: Number,
		required: false,
		default: null,
	},
	remainder: {
		type: Number,
		required: false,
		default: null,
	},
}, {
	collection: 'plan-detail'
})

module.exports = model('PlanDetail', PlanDetailSchema)