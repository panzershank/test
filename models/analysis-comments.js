const {Schema, model} = require('mongoose')

const analysisCommentsSchema = new Schema({
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
	url: {
		type: String,
		required: false,
		default: null,
	},
	date: {
		type: Date,
		required: true,
		default: Date.now,
	},
	text: {
		type: String,
		required: false,
		default: null,
	},
	authorName: {
		type: String,
		required: false,
		default: null,
	},
}, {
	collection: 'analysis-comments'
})

module.exports = model('AnalysisComments', analysisCommentsSchema)