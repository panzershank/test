const axios = require("axios");

const config = require("../../config");

const checkTaskId = async (req, res) => {
    const { taskId } = req.query;

    const responseArsenkin = await axios.get(`${config.URL_CHECK_ARSENKIN_SERVICE}?token=${config.TOKEN_ARSENKIN_SERVICE}&task_id=${taskId}`);

    if (responseArsenkin?.data && !responseArsenkin?.data?.error) {
        res.status(200).json({
            status: "success",
            data: responseArsenkin?.data,
        });
    }

    if (responseArsenkin?.data?.error) {
        res.status(400).json({
            status: "error",
            message: responseArsenkin?.data?.error,
        });
    }
};

module.exports = checkTaskId;
