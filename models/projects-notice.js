const {Schema, model} = require('mongoose')

const projectsNoticeSchema = new Schema({
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
	project: {
		type: Schema.Types.ObjectId,
		ref: 'Projects',
		required: true,
		default: null,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'Users',
		required: true,
		default: null,
	},
	deleted: {
		type: Boolean,
		required: true,
		default: false,
	},
}, {
	collection: 'projects-notice'
})

module.exports = model('ProjectsNotice', projectsNoticeSchema)