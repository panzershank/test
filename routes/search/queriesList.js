/* ==========================================================================
   Поисковые запросы: выбор данных
   ========================================================================== */

const SearchQuery = require("../../models/search-query")
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")

const queriesList = async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)
    const projectId = req.query.project

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!projectId) {
        errors.push('Проект не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const queries = await SearchQuery.find({
            project: projectId,
            deleted: false,
        }).sort([['name', 1]])

        const arrQueries = queries.map(item => ({
            value: item.name,
            count: (item.count ? item.count : 0),
        }))

        res.json({
            status: 'success',
            queries: arrQueries,
        })
    }
}

module.exports = queriesList