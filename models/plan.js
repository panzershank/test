const {Schema, model} = require('mongoose')

const planSchema = new Schema({
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
	project: {
		type: Schema.Types.ObjectId,
		ref: 'Projects',
		required: true,
		default: null,
	},
	dateFrom: {
		type: Date,
		required: true,
		default: null,
	},
	dateTo: {
		type: Date,
		required: true,
		default: null,
	},
	type: {
		type: Number,
		required: false,
		default: null,
	},
}, {
	collection: 'plan'
})

module.exports = model('Plan', planSchema)