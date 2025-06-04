/* ==========================================================================
   Добавление нового кастомного блока
   ========================================================================== */
const fs = require('fs')

const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const Desktop = require('../../models/desktop')
const DesktopBlocks = require('../../models/desktopBlocks')
const createDir = require('../../utils/createDir')
const { mongo } = require("mongoose");

const addBlock = async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token) || {}

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.desktopId) {
        errors.push('Рабочий стол не указан')
    } else {
        const desktopCheck = await Desktop.findById(req.body.desktopId)

        if (!desktopCheck) {
            errors.push('Рабочий стол не найден')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const desktopId = req.body.desktopId
        const user = data.user
        let sort = 300

        const desktopBlocks = await DesktopBlocks.find({
            desktop: desktopId,
            deleted: false,
        }).sort([['sort', 1]]) || []

        if (desktopBlocks.length) {
            for (const block of desktopBlocks) {
                if (!sort || (sort && block.sort > sort)) {
                    sort = block.sort
                }
            }
        }

        sort += 100

        const files = await Promise.all(req.body.documents?.map(async (doc) => {
            const createdFile = await createDir(doc.file, req.query.project, req.query.company)
            return { ...doc, file: mongo.ObjectId(createdFile._id) }
        }))


        const desktopBlock = new DesktopBlocks({
            createdBy: user._id,
            desktop: desktopId,
            name: (req.body.name ? req.body.name : ''),
            description: (req.body.description ? req.body.description : ''),
            url: (req.body.url ? req.body.url : ''),
            documents: files || [],
            type: 4,
            sort: sort,
            uuidPath: req.body.uuidPath ? req.body.uuidPath : "",
        }) || {}

        await desktopBlock.save()

        res.json({
            status: 'success',
            block: desktopBlock,
        })
    }
}

module.exports = addBlock
