const {Schema, model} = require('mongoose')

const analysisQueriesDetailSchema = new Schema({
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
	query: {
		type: Schema.Types.ObjectId,
		ref: 'AnalysisQueries',
		required: true,
		default: null,
	},
	position: {
		type: Number,
		required: false,
		default: null,
	},
	url: {
		type: String,
		required: false,
		default: null,
	},
	title: {
		type: String,
		required: false,
		default: null,
	},
	description: {
		type: String,
		required: false,
		default: null,
	},
	rating: {
		type: Number,
		required: false,
		default: null,
	},
	tonality: {
		type: String,
		required: false,
		default: null,
	},
	category: {
		type: Schema.Types.ObjectId,
		ref: 'AnalysisCategory',
		required: false,
		default: null,
	},
}, {
	collection: 'analysis-queries-detail'
})

module.exports = model('AnalysisQueriesDetail', analysisQueriesDetailSchema)