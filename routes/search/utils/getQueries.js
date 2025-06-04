/* ==========================================================================
   Выбираем список поисковых запросов для проекта
   ========================================================================== */

const SearchQuery = require("../../../models/search-query")

const getQueries = async (projectId) => {
    const arrQueries = []

    if (projectId) {
        const queries = await SearchQuery.find({
            project: projectId,
            deleted: false,
        }).sort([['name', 1]])

        if (queries) {
            for (const item of queries) {
                arrQueries.push(item)
            }
        }
    }

    return (arrQueries.length ? arrQueries.map(item => ({
        value: item.name,
        count: (item.count ? item.count : 0),
    })) : [])
}

module.exports = getQueries