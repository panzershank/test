const {Schema, model} = require('mongoose')

const telegramLoginSchema = new Schema({
	createdDate: {
		type: Date,
		required: true,
		default: Date.now,
	},
	code: {
		type: String,
		required: true,
		default: null,
	},
	chat: {
		type: String,
		required: true,
		default: null,
	},
}, {
	collection: 'telegram-login'
})

module.exports = model('TelegramLogin', telegramLoginSchema)