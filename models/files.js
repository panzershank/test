const {Schema, model} = require('mongoose')

const File = new Schema({
	name: {type: String, required: true},
	type: {type: String, required: true},
	size: {type: Number, default: 0},
	path: {type: String, default: ''},
	project: {type: Schema.Types.ObjectId, ref: 'Projects'},
	company: {type: Schema.Types.ObjectId, ref: 'Companies'}
}, {
	collection: 'file'
})

module.exports = model('File', File)