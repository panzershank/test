/* ==========================================================================
   Удалить кастомный блок
   ========================================================================== */

const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const DesktopBlocks = require('../../models/desktopBlocks')
const Project = require('../../models/projects')
const Company = require('../../models/companies')
const { translit } = require('gost-transliteration')
const fs = require('fs').promises;

const deleteBlock = async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token) || {}

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.params.id) {
        errors.push('Блок для удаления не указан')
    } else {
        const blockCheck = await DesktopBlocks.findOne({
            _id: req.params.id,
            type: 4,
        })

        if (!blockCheck) {
            errors.push('Блок не найден')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = data.user

        const block = await DesktopBlocks.findOne({
            _id: req.params.id,
            type: 4
        })

        const proj = await Project.findById(req.query.project)
        const comp = await Company.findById(req.query.company)
        const compName = translit(comp.name).replace(/[^a-zA-Zа-яА-Я0-9-_ ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase()
		const projName = translit(proj.name).replace(/[^a-zA-Zа-яА-Я0-9-_ ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase()

        fs.rm(`files/${compName}/${projName}/${block.uuidPath}`, { recursive: true })

        block.modifiedBy = user._id
        block.modifiedDate = Date.now()
        block.deleted = true

        await block.save()

        res.json({
            status: 'success',
        })
    }
}

module.exports = deleteBlock
