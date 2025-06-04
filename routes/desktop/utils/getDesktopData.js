/* ==========================================================================
   Выбираем блоки рабочего стола проекта
   ========================================================================== */

const Desktop = require('../../../models/desktop')
const DesktopBlocks = require('../../../models/desktopBlocks')
const createDesktop = require("./createDesktop")
const getFileDataToReturn = require('./getFileDataToReturn')

const getReturnData = async (block) => {
    const documents = []

    for (const el of block.documents) {
        const file = await getFileDataToReturn(el.file)

        documents.push({
            ...el,
            file: file
        })
    }

    return {
        createdBy: block.createdBy,
        modifiedBy: block.modifiedBy,
        modifiedDate: block.modifiedDate,
        deleted: block.deleted,
        desktop: block.desktop,
        name: block.name,
        description: block.description,
        url: block.url,
        iconPath: block.iconPath,
        uuidPath: block.uuidPath,
        type: block.type,
        sort: block.sort,
        _id: block._id,
        createdDate: block.createdDate,
        __v: block.__v,
        documents: documents
    }
}

const getDesktopData = async (projectId) => {
    const returnData = {
        id: false,
        blocks: [],
    }

    if (projectId) {
        const desktop = await Desktop.findOne({
            project: projectId.toString(),
        }) || await createDesktop(projectId)

        if (desktop) {
            returnData.id = desktop._id.toString()

            returnData.size = parseInt(desktop.size)

            const desktopBlocks = await DesktopBlocks.find({
                desktop: desktop._id.toString(),
                deleted: false,
            }).sort([['sort', 1]]) || []

            if (desktopBlocks.length) {
                for (const block of desktopBlocks) {
                    const returnBlock = await getReturnData(block)

                    returnData.blocks.push(returnBlock)
                }
            }
        }
    }

    // console.log(returnData)

    return returnData
}

module.exports = getDesktopData
