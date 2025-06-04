/* ==========================================================================
   Телеграм
   ========================================================================== */

const {Router} = require('express')
const router = Router()

const hook = require("./hook")
const code = require("./code")
const sendNotice = require("./sendNotice")
const subscribe = require("./subscribe")

router.post('/hook', hook)
router.post('/code', code)
router.post('/send-notice', sendNotice)
router.post('/subscribe', subscribe)

module.exports = router