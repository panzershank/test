const {Router} = require('express')
const router = Router()
const Statuses = require('../models/statuses')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')
const Replica = require("../models/replica");
const {mongo} = require("mongoose");
const UsersInProject = require("../models/users-in-project");
const moment = require("moment");
const {filter} = require("compression");
const Companies = require("../models/companies");

router.get('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)
    const user = data.user

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    }


    // Выбираем связи пользователей с проектами
    const usersInProject = await UsersInProject.find({
        active: true,
        deleted: false,
        userId: user._id.toString()
    }).select('projectId')

    // Определяем список проектов пользователя
    const ids = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId._id.toString())) : []

    // Поиск активных компаний
    const foundActiveCompanies = await Companies.find({
        active: true,
        deleted: false,
    });

    // Добавляем ObjectID к активным компаниям
    const filteredActiveCompanies = foundActiveCompanies.map(item => mongo.ObjectId(item._id));

    const parentId = req.query.parentId ? req.query.parentId : null;
    const searchInput = req.query['f-search'];
    const company = req.query['f-company'];
    const project = req.query['f-project'];
    const category = req.query['f-category'];
    const type = (!req.query['type'] || req.query['type'] === "null") ? null : +req.query['type'];
    const to = req.query['f-dateTo']
    const from = req.query['f-dateFrom']
    const platform = req.query['f-platform']
    const dateFrom = moment(from, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString()
    const dateTo = moment(to, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString()
    const statusChange = req.query['f-status-change'] ? req.query['f-status-change'] : null

    const platforms = [
        platform,
        ` ${platform}`,
        `\r\n${platform}`,
        `\r\n${platform} `,
        `\n\r${platform}`,
        `\r${platform}`,
        `\n${platform}`,
        ` \r${platform}`,
        ` \n${platform}`,
        `${platform} `,
        `${platform}\r\n`,
        `${platform}\n\r`,
        `${platform}\r`,
        `${platform}\n`,
        `${platform}\r `,
        `${platform}\n `,
        ` ${platform} `,
    ];

    // const date = statusChange === "Y" ? {
    //     ...(dateFrom && {$gte: ["$statusChange", new Date(dateFrom)]}),
    //     ...(dateTo && {$lte: ["$statusChange", new Date(dateTo)]}),
    // } : {
    //     ...(dateFrom && {$gte: ["$date", new Date(dateFrom)]}),
    //     ...(dateTo && {$lte: ["$date", new Date(dateTo)]}),
    // }

    // const where = [
    //     {$eq: ["$deleted", false]},
    //     // {$eq: ["$parentId", parentId]},
    //     // {$eq: ["type", null]},
    //     {
    //         $eq: [
    //             "$$id",
    //             "$status"
    //         ]
    //     },
    //
    //     // {...(dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]})},
    //     // {...(dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]})},
    //     ////////////// {...(company && {$eq: ["$company", mongo.ObjectId(company)]})}, +
    //     ////////////// {...(platform && {$eq: ["$platform", platform]})}, +
    //     ////////////// {...(project && {$eq: ["$project", mongo.ObjectId(project)]})}, +
    //     ////////////// {...(category && {$eq: ["$category", mongo.ObjectId(category)]})}, +
    //     ///////////// {...(parentId ? {$eq: ["$parentId", parentId]} : {$eq: ["$parentId", null]})}, +
    //     ///////////// {...(type  {$eq: ["$type", +type]} : {$eq: ["$type", null]})}, +
    //     // {...(+user.role.accessLevel === 1 ? project && {$eq: ["$project", mongo.ObjectId(project)]} : project ? {$eq: ["$project", mongo.ObjectId(project)]} : {$in: ["$project", ids]})}, +
    // ]
    //
    // // const test = {
    // //     ...(searchInput && {
    // //             search: {
    // //                 "$regex": searchInput,
    // //                 "$options": "i"
    // //             }
    // //         }),
    // // };

    const dateQuery = statusChange === "Y" ? {
        statusChange: {
            ...(dateFrom && {['$gte']: new Date(dateFrom)}),
            ...(dateTo && {['$lte']: new Date(dateTo)})
        }
    } :  {
        date: {
            ...(dateFrom && {['$gte']: new Date(dateFrom)}),
            ...(dateTo && {['$lte']: new Date(dateTo)})
        }
    };

    const filters = {
        ...(Object.keys(dateQuery?.date || dateQuery?.statusChange).length > 0 && dateQuery),
        deleted: false,
        parentId: parentId,
        type: type,
        ...(company ? {company: mongo.ObjectId(company)} : {company: {$in: filteredActiveCompanies }}),
        ...(platform && {platform: {$in: platforms}}),
        ...(project && {project: mongo.ObjectId(project)}),
        ...(category && {category: mongo.ObjectId(category)}),
        ...(searchInput && {
            search: {
                "$regex": searchInput,
                "$options": "i",
            },
        }),
        ...(+user.role.accessLevel === 1 ? project && {project: mongo.ObjectId(project)} : {project: project ? mongo.ObjectId(project) : {$in: ids}}),
    };

    if (ids.length === 0 && +user.role.accessLevel === 2) {
        return res.json({
            status: 'success',
            data: [],
        })
    }

    const aggregationReplica = await Replica.aggregate([
        {
            $match: {
                ...filters,
            }
        },
        {
            $lookup: {
                from: "statuses",
                localField: "status",
                foreignField: "_id",
                as: "status_info",
            }
        },
        {
          $unwind: {
              "path": "$status_info",
          },
        },
        {
            $group: {
                _id: "$status",
                name: {
                    "$first": "$status_info.name",
                },
                code: {
                        "$first": "$status_info.code",
                },
                count: {$sum: 1},
            }
        },
        {
            "$project": {
                "_id": 0,
                "id": "$_id",
                "name": "$name",
                "code": "$code",
                "count": "$count",
            }
        },
        {$sort: {name: 1}},
    ]).allowDiskUse(true);

    const resultStatusesWithCount = [];

    const statuses = await Statuses.find({});

    statuses.forEach(status => {
       const filteredStatus = aggregationReplica.filter(item => item.code === status.code);

       if (!filteredStatus.length) {
           resultStatusesWithCount.push({
               id: status._id,
               name: status.name,
               code: status.code,
               count: 0,
           })
       } else {
           resultStatusesWithCount.push(filteredStatus[0]);
       }
    });

    const sortedResulStatusesWithCount = resultStatusesWithCount.sort((a, b) => a.name > b.name ? 1 : -1);

    res.json({
        status: 'success',
        data: sortedResulStatusesWithCount,
    })
})

router.post('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.name) {
        errors.push('Укажите название статуса')
    }

    if (!req.body.code) {
        errors.push('Укажите код статуса')
    }

    if (!req.body.sort) {
        errors.push('Укажите позицию сортировки')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const status = new Statuses({
            name: req.body.name,
            code: req.body.code,
            sort: req.body.sort,
        })

        await status.save()

        res.json({
            status: 'success'
        })
    }
})

module.exports = router
