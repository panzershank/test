const {Schema, model} = require('mongoose')

const analysisQueriesSchema = new Schema({
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
	date: {
		type: Date,
		required: true,
		default: Date.now,
	},
	searchQuery: {
		type: String,
		required: true,
		default: null,
	},
	searchSystem: {
		type: String,
		required: false,
		default: null,
	},
	type: {
		type: Number,
		required: false,
		default: null,
	},
	region: {
		type: String,
		required: false,
		default: null,
	},
	frequency: {
		type: Number,
		required: false,
		default: null,
	},
}, {
	collection: 'analysis-queries'
})

module.exports = model('AnalysisQueries', analysisQueriesSchema)