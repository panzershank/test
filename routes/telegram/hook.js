/* ==========================================================================
   Регистрируем новый код для логирования часа, сюда стучится хук телеграма
   ========================================================================== */

const TelegramLogin = require("../../models/telegramLogin")
const sendMessage = require("./utils/sendMessage")
const randomstring = require("randomstring")

const hook = async (req, res) => {
	const params = req.body

	if (params && params.message && params.message.chat && params.message.chat.id && params.message.text && params.message.text === 'subscribe') {
		const code = randomstring.generate(20)
		const chat = params.message.chat.id
		const result = await sendMessage(chat, code, null)

		if (result) {
			const telegramLogin = new TelegramLogin({
				createdDate: Date.now(),
				code: code,
				chat: chat,
			})

			await telegramLogin.save()
		}
	}

	res.json({
		status: 'success',
	})
}

module.exports = hook