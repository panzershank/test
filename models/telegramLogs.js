const {Schema, model} = require('mongoose')

const telegramLogsSchema = new Schema({
	createdDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
	text: {
		type: String,
		required: false,
		default: null,
	},
	chat: {
		type: String,
		required: true,
		default: null,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'Users',
		required: false,
		default: null,
	},
}, {
	collection: 'telegram-logs'
})

module.exports = model('TelegramLogs', telegramLogsSchema)