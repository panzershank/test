/* ==========================================================================
   Анализ поисковой выдачи
   ========================================================================== */

const {Router} = require('express')
const router = Router()

const importData = require("./import-data")
const findCountry = require("./controller.analysis")
const queries = require("./queries")
const searchListExport = require("./search-list-export")
const searchList = require("./search-list")
const tonalityList = require("./tonality")
const ratingList = require("./rating")
const searchTonality = require("./search-tonality")
const searchCategory = require("./search-category")
const ratingComment = require("./rating-comment.js")
const frequencyToggle = require("./frequency-toggle.js")
const ratingCommentDelete = require("./rating-comment-delete.js")
const loadData = require("./load-data")


router.get('/search', findCountry)

router.post('/import-data', importData)
router.post('/queries', queries)
router.get('/search/export', searchListExport)
router.get('/search', searchList)
router.get('/tonality', tonalityList)
router.get('/rating', ratingList)
router.post('/search/tonality/:id', searchTonality)
router.post('/search/category/:id', searchCategory)
router.post('/rating/comments/:id', ratingComment)
router.post('/frequency', frequencyToggle)
router.delete('/rating/comments/:id', ratingCommentDelete)
router.get('/', loadData)

module.exports = router
