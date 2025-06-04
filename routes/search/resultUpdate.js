/* ==========================================================================
   Обновление результатов выборки
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Search = require("../../models/search")

const resultUpdate = async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (!req.body.type && !req.body.tonality) {
        errors.push('Обязательные данные не указаны')
    }

    const result = await Search.findById(req.params.id)

    if (!result) {
        errors.push('Результат не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        if (req.body.type) {
            result.type = req.body.type
        } else if (req.body.tonality) {
            result.tonality = req.body.tonality
        }

        result.modifiedBy = data.user._id
        result.modifiedDate = Date.now()

        await result.save()

        res.json({
            status: 'success',
        })
    }
}

module.exports = resultUpdate