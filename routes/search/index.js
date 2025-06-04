/* ==========================================================================
   Поисковая выдача
   ========================================================================== */

const {Router}  = require('express')
const router = Router()

const importStart = require("./importStart")
const importProcess = require("./importProcess")
const queries = require("./queries")
const queriesList = require("./queriesList")
const loadData = require("./loadData")
const resultUpdate = require("./resultUpdate")

router.get('/import-start', importStart)
router.get('/import-process', importProcess)
router.post('/queries', queries)
router.get('/queries', queriesList)
router.get('/', loadData)
router.put('/:id', resultUpdate)

module.exports = router