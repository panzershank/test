/* ==========================================================================
   План
   ========================================================================== */

const {Router} = require('express')
const router = Router()

const getPlan = require("./getPlan")
const addPlan = require("./addPlan")

router.get('/', getPlan)
router.post('/', addPlan)

module.exports = router