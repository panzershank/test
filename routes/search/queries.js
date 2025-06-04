/* ==========================================================================
   Поисковые запросы: создание / изменение / удаление
   ========================================================================== */

const SearchQuery = require("../../models/search-query")
const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")

const queries = async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)
    const projectId = req.body.projectId

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!projectId) {
        errors.push('Проект не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = data.user
        const userId = user._id.toString()

        const queries = await SearchQuery.find({
            project: projectId,
            deleted: false,
        })

        const arrQueries = {}

        if (queries && queries.length > 0) {
            for (const item of queries) {
                arrQueries[item.name.toLowerCase()] = item._id.toString()
            }
        }

        if (req.body.query && req.body.query.length) {
            for (const item of req.body.query) {
                const value = item.value.trim()
                const valueLower = value.toLowerCase()

                if (value) {
                    if (arrQueries[valueLower]) {
                        const query = await SearchQuery.findById(arrQueries[valueLower])

                        if (query) {
                            query.name = value
                            query.count = (item.count ? item.count : 0)
                            query.modifiedBy = data.user._id
                            query.modifiedDate = Date.now()

                            await query.save()
                            delete arrQueries[valueLower]
                        }
                    } else {
                        const query = new SearchQuery({
                            createdBy: userId,
                            createdDate: Date.now(),
                            project: projectId,
                            name: value,
                            count: (item.count ? item.count : 0),
                        })

                        await query.save()
                    }
                }
            }
        }

        if (arrQueries) {
            for (const item of Object.keys(arrQueries)) {
                const query = await SearchQuery.findById(arrQueries[item])
                query.deleted = true
                await query.save()
            }
        }

        res.json({
            status: 'success'
        })
    }
}

module.exports = queries