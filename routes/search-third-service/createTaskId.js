const axios = require("axios");
const fs = require("fs");
const path = require("path");

const config = require("../../config");
const Users = require("../../models/users");
const SearchingQueries = require("../../models/searching-queries");

const FIND_SYSTEMS = [
    { id: 1, name: 'Яндекс XML' },
    { id: 2, name: 'Яндекс Desktop' },
    { id: 3, name: 'Яндекс Mobile' },
    { id: 11, name: 'Google Desktop' },
    { id: 12, name: 'Google Mobile' },
];

const createTaskId = async (req, res) => {
    const { toolName, brandName, findSystem, regionId, deep, id, regionName } = req.body;

    if (!id) {
        res.status(400).json({
            status: "error",
            message: "Необходимо перезайти в аккаунт",
        });

        return;
    }

    const region = `&lr=${regionId}`;
    const encodedBrandName = encodeURI(brandName);

    const findSystemName = FIND_SYSTEMS.filter(system => system.id === findSystem)[0].name;

    const responseArsenkin = await axios.get(`${config.URL_SET_ARSENKIN_SERVICE}?token=${config.TOKEN_ARSENKIN_SERVICE}
       &tools_name=${toolName}\
       &ss=${findSystem}
       ${region}
       &queries=[${JSON.stringify(encodedBrandName)}]
       &deep=${deep}
       &is_snippet=1
       &noreask=1`);

    if (responseArsenkin?.data?.task_id && !responseArsenkin?.data?.error) {
        const userInfo = await Users.findOne({ _id: id });

        const usersSearchingStream = fs.createWriteStream(path.join(__dirname, 'users-searching.log'), { flags: 'a' });
        usersSearchingStream.write(`[${new Date().toISOString()}] || Name: ${userInfo?.name} || Last Name: ${userInfo?.lastName} || Email: ${userInfo?.email} || Company ID: ${userInfo?.companyId} || Task ID: ${responseArsenkin?.data?.task_id} || Query: ${brandName} \n`);
        usersSearchingStream.end();

        const searchingQuery = new SearchingQueries({
            createdBy: id.toString(),
            createdDate: Date.now(),
            isResults: false,
            taskId: responseArsenkin?.data?.task_id,
            toolName,
            brandName,
            regionId,
            regionName,
            deep,
            findSystem,
            findSystemName,
        });

        await searchingQuery.save();

        res.status(200).json({
            status: "success",
            task_id: responseArsenkin?.data?.task_id,
        });
    }

    if (responseArsenkin?.data?.error) {
        res.status(400).json({
            status: "error",
            message: responseArsenkin?.data?.error,
        });
    }
};

module.exports = createTaskId;
