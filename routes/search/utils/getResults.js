/* ==========================================================================
   Выбираем результаты для поискового запроса
   ========================================================================== */

const Search = require("../../../models/search")

const getResults = async ({projectId, query, dateFrom, dateTo, deepLevel, searchSystem}) => {
    const arrResults = []

    if (projectId && query && dateFrom && dateTo && deepLevel && searchSystem) {
        const queries = await Search.find({
            project: projectId,
            deleted: false,
            searchQuery: query,
            position: {$lte: deepLevel},
            searchSystem: searchSystem,
        }).sort([['position', 1]])

        if (queries) {
            for (const item of queries) {
                arrResults.push(item)
            }
        }
    }

    return (arrResults.length ? arrResults.map(item => ({
        id: item._id.toString(),
        searchSystem: item.searchSystem,
        tonality: item.tonality,
        type: item.type,
        url: item.url,
        domain: item.domain,
        title: item.title,
        description: item.description,
        position: item.position,
    })) : [])
}

module.exports = getResults