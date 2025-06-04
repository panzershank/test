/* ==========================================================================
   Создаем список заданий для PixelTools
   ========================================================================== */

const SearchQuery = require("../../models/search-query")
const SearchTasks = require("../../models/search-tasks")

const importStart = async (req, res) => {
    const queries = await SearchQuery.find({
        deleted: false,
    })

    if (queries) {
        const queriesInProject = {}

        for (const query of queries) {
            if (!queriesInProject[query.project]) {
                queriesInProject[query.project] = []
            }

            queriesInProject[query.project].push(query.name)
        }

        if (queriesInProject) {
            for (const project of Object.keys(queriesInProject)) {
                if (queriesInProject[project] && queriesInProject[project].length) {
                    const taskYandex = new SearchTasks({
                        createdDate: Date.now(),
                        project: project,
                        queries: queriesInProject[project],
                        searchSystem: 'yandex',
                        status: 'W',
                    })

                    const taskGoogle = new SearchTasks({
                        createdDate: Date.now(),
                        project: project,
                        queries: queriesInProject[project],
                        searchSystem: 'google',
                        status: 'W',
                    })

                    await taskYandex.save()
                    await taskGoogle.save()
                }
            }
        }
    }

    res.json({
        status: 'success',
    })
}

module.exports = importStart