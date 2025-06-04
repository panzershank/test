const axios = require('axios');

const config = require('../../config');
const convertTaskToRow = require('../../utils/convert-task-to-row');

const SearchingQueries = require("../../models/searching-queries");
const SearchingQueryResults = require("../../models/searching-query-results");

const searchResult = async (req, res) => {
    const { taskId } = req.query;

    const responseArsenkin = await axios.get(`${config.URL_RESULT_ARSENKIN_SERVICE}?token=${config.TOKEN_ARSENKIN_SERVICE}&task_id=${taskId}`);

    if (responseArsenkin?.data?.result && !responseArsenkin?.data?.error) {
        const result = responseArsenkin?.data?.result;


        const searchingQuery = await SearchingQueries.findOne({ taskId: taskId });
        const tasks = convertTaskToRow(result, searchingQuery._id);
        let createdTasks;

        if (tasks?.length > 0 && searchingQuery) {
            createdTasks = await SearchingQueryResults.insertMany(tasks);
            await SearchingQueries.findOneAndUpdate({ taskId: taskId },{ isResults: true });
        }

        res.status(200).json({
            status: "success",
            result,
            tasks: createdTasks,
        });
    }

    if (responseArsenkin?.data?.error) {
        res.status(400).json({
            status: "error",
            message: responseArsenkin?.data?.error,
        });
    }
};

module.exports = searchResult;
