/* ==========================================================================
   Рабочий стол
   ========================================================================== */

const { Router }  = require('express')
const router = Router()
const deleteBlock = require("./deleteBlock")
const { updateBlock } = require("./updateBlock")
const addBlock = require("./addBlock")
const getDesktop = require("./getDesktop")
const getSize = require('./getSize')
const getFile = require('./getFile')
const removeFile = require('./removeFile');
const createFile = require('./createFile')
const multer = require('multer');

router.delete('/block/:id', deleteBlock)
router.put('/block/:id', updateBlock)
router.post('/block', addBlock)
router.get('/', getDesktop)
router.get('/size', getSize)
router.get('/file', getFile)
router.post('/file', createFile)
router.delete('/file', removeFile)

module.exports = router