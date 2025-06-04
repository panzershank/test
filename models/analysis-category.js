const {Schema, model} = require('mongoose')

const analysisCategorySchema = new Schema({
	deleted: {
		type: Boolean,
		required: true,
		default: false,
	},
	sort: {
		type: Number,
		required: true,
		default: 500,
	},
	name: {
		type: String,
		required: true,
		default: null,
	},
}, {
	collection: 'analysis-category'
})

module.exports = model('AnalysisCategory', analysisCategorySchema)