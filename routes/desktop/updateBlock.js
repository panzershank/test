/* ==========================================================================
   Обновление информации в блоке
   ========================================================================== */

const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const DesktopBlocks = require('../../models/desktopBlocks')
const createDir = require('../../utils/createDir')
const { mongo } = require("mongoose");

const getFile = async (req, files) => {
    for (const el of req.body.documents) {
        if (el.file.id) {
            await createDir(el.file, req.query.project, req.query.company).then((res) => {
                files.push({...el, file: mongo.ObjectId(res._id) })
            }).catch((e) => {
                console.log(e)
            })
        } else {
            files.push({ ...el, file: mongo.ObjectId(el.file._id) })
        }
    }
}

const updateBlock = async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token) || {}

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.params.id) {
        errors.push('Блок для редактирования не указан')
    } else {
        const blockCheck = await DesktopBlocks.findById(req.params.id)

        if (!blockCheck) {
            errors.push('Блок не найден')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = data.user
        
        const fileIds = []
    
        // console.log('DOCUMENTS ---- ', req.body.documents)
        
        if (req.body.documents) {
            await getFile(req, fileIds)
        }
    
        // console.log('IDS ----- ', fileIds)
        
        const block = await DesktopBlocks.findById(req.params.id)

        if (req.body.name !== undefined) {
            block.name = req.body.name
        }

        if (req.body.description !== undefined) {
            block.description = req.body.description
        }

        if (req.body.url !== undefined) {
            block.url = req.body.url
        }

        if (req.body.documents) {
            block.documents = fileIds
        }

        block.modifiedBy = user._id
        block.modifiedDate = Date.now()
    
        // console.log('BLOCK ---- ', block)

        await block.save()

        res.json({
            status: 'success',
        })
    }
}

module.exports = { updateBlock, getFile }