/* ==========================================================================
   Создаем запись в истории логирования реплик
   ========================================================================== */

const TelegramLogs = require("../../../models/telegramLogs")
const axios = require("axios")
const config = require('../../../config')

const sendMessage = async (chat, text, user) => {
	let result = false

	if (chat && text) {
		const response = await axios.get(`https://api.telegram.org/bot${config.TELEGRAM_API}/sendMessage?chat_id=${chat}&text=${encodeURI(text)}&parse_mode=HTML`, {
			validateStatus: function (status) {
				return true
			}
		})

		const data = response.data

		if (data && data.ok) {
			result = true
		}
	}

	if (result) {
		const telegramLogs = new TelegramLogs({
			createdDate: Date.now(),
			text: text,
			chat: chat,
			user: (user && user.toString() ? user.toString() : null),
		})

		await telegramLogs.save()
	}

	return result
}

module.exports = sendMessage