/* ==========================================================================
   Если есть задания для PixelTools в статусе "В процессе" - выполняем проверку отчетов
   Если есть задания для PixelTools и в PixelTools есть место - запускаем формирование отчета
   ========================================================================== */

const Search = require("../../models/search")
const SearchTasks = require("../../models/search-tasks")
const importCreate = require("./utils/importCreate")
const importGetReport = require("./utils/importGetReport")

const checkReport = async () => {
    const tasksProcess = await SearchTasks.find({
        status: 'P',
    })

    if (tasksProcess) {
        for (const task of tasksProcess) {
            if (task.reportId) {
                const reportData = await importGetReport(task.reportId)

                if (reportData && reportData.response) {
                    const results = reportData.response.response.result
                    const arrSearch = []

                    for (const searchQuery of Object.keys(results)) {
                        if (results[searchQuery]) {
                            for (const key of Object.keys(results[searchQuery])) {
                                if (results[searchQuery][key].length) {
                                    let position = 1

                                    for (const item of results[searchQuery][key]) {
                                        arrSearch.push({
                                            createdDate: Date.now(),
                                            project: task.project,
                                            searchQuery: searchQuery,
                                            searchSystem: task.searchSystem,
                                            url: item.url,
                                            domain: item.domain,
                                            title: item.title,
                                            description: item.snippet,
                                            position: position,
                                        })

                                        position++
                                    }
                                }
                            }
                        }
                    }

                    if (arrSearch.length) {
                        await Search.insertMany(arrSearch)
                    }

                    const taskDetail = await SearchTasks.findById(task._id.toString())

                    if (taskDetail) {
                        taskDetail.modifiedDate = Date.now()
                        taskDetail.status = 'F'

                        await taskDetail.save()
                    }
                }
            } else {
                const taskDetail = await SearchTasks.findById(task._id.toString())

                if (taskDetail) {
                    taskDetail.modifiedDate = Date.now()
                    taskDetail.status = 'C'

                    await taskDetail.save()
                }
            }
        }
    }
}

const startProcess = async () => {
    const tasks = await SearchTasks.find({
        status: 'W',
    }).sort([['createdDate', 1]])

    if (tasks) {
        const tasksProcess = await SearchTasks.find({
            status: 'P',
        })

        const taskProcessCountFree = 3 - tasksProcess.length

        if (taskProcessCountFree > 0) {
            let counter = 1

            for (const task of tasks) {
                if (counter <= taskProcessCountFree) {
                    counter++

                    const reportId = await importCreate({
                        queries: task.queries,
                        ss: task.searchSystem,
                    })

                    if (reportId) {
                        const taskDetail = await SearchTasks.findById(task._id.toString())

                        if (taskDetail) {
                            taskDetail.modifiedDate = Date.now()
                            taskDetail.status = 'P'
                            taskDetail.reportId = reportId

                            await taskDetail.save()
                        }
                    }
                } else {
                    break
                }
            }
        }
    }
}

const importProcess = async (req, res) => {
    await checkReport()
    await startProcess()

    res.json({
        status: 'success',
    })
}

module.exports = importProcess