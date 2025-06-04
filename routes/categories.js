const {Router} = require('express')
const router = Router()
const Categories = require('../models/categories')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')
const {mongo} = require("mongoose");
const UsersInProject = require("../models/users-in-project");
const moment = require("moment/moment");
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
    } else {
        const searchInput = req.query['f-search'];
        const parentId = req.query.parentId ? req.query.parentId : null;
        const type = (!req.query['type'] || req.query['type'] === "null") ? null : +req.query['type'];

        const company = req.query['f-company'];
        const project = req.query['f-project'];

        const to = req.query['f-dateTo']
        const from = req.query['f-dateFrom']
        const status = req.query['f-status']
        const platform = req.query['f-platform']

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

        const dateFrom = moment(from, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString()
        const dateTo = moment(to, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString()

        const statusChange = req.query['f-status-change'] ? req.query['f-status-change'] : null

        const date = statusChange === "Y" ? {
            ...(dateFrom && {$gte: ["$statusChange", new Date(dateFrom)]}),
            ...(dateTo && {$lte: ["$statusChange", new Date(dateTo)]}),
        } : {
            ...(dateFrom && {$gte: ["$date", new Date(dateFrom)]}),
            ...(dateTo && {$lte: ["$date", new Date(dateTo)]}),
        }

        // Поиск активных компаний
        const foundActiveCompanies = await Companies.find({
            active: true,
            deleted: false,
        });

        // Добавляем ObjectID к активным компаниям
        const filteredActiveCompanies = foundActiveCompanies.map(item => mongo.ObjectId(item._id));

        // Выбираем связи пользователей с проектами
        const usersInProject = await UsersInProject.find({
            active: true,
            deleted: false,
            userId: user._id.toString()
        }).select('projectId')

        // Определяем список проектов пользователя
        const ids = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId._id.toString())) : []

        const where = [
            { $eq: ["$deleted", false]},

            {
                $eq: [
                    "$$id",
                    "$category"
                ]
            },
            {...{$eq: ["$type", type]}},
            {...{$eq: ["$parentId", parentId]}},
            {...(platform && {$in: ["$platform", platforms]})},
            {...(dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]})},
            {...(dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]})},
            {...(status && {$eq: ["$status", mongo.ObjectId(status)]})},
            { ...(company ? { $eq: ["$company", mongo.ObjectId(company)]} : { $in: ["$company", filteredActiveCompanies] })},
            {...(+user.role.accessLevel === 1 ? project && {$eq: ["$project", mongo.ObjectId(project)]} : project ? {$eq: ["$project", mongo.ObjectId(project)]} : ids.length > 0 &&  {$in: ["$project", ids]})},
        ]

        if (ids.length === 0 && +user.role.accessLevel === 2) {
            res.json({
                status: 'success',
                data: [],
            })
        } else {
            const forCategory = await Categories.aggregate([

                {
                    $lookup:
                        {
                            from: "replica",
                            let: {
                                id: "$_id"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: where
                                        },
                                        ...(searchInput && {
                                            search: {
                                                "$regex": searchInput,
                                                "$options": "i",
                                            },
                                        }),
                                    },
                                }
                            ],
                            as: "total"
                        }
                },
                {
                    "$project": {
                        "_id": 0,
                        "id": "$_id",
                        "name": "$name",
                        "count": {
                            "$size": "$total"
                        }
                    }
                },
                {$sort: {name: 1, _id: 1}},
            ]).allowDiskUse(true);

            res.json({
                status: 'success',
                data: forCategory
            })
        }
    }
})

router.post('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.name) {
        errors.push('Укажите название категории')
    }

    if (!req.body.sort) {
        errors.push('Укажите позицию сортировки')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const category = new Categories({
            name: req.body.name,
            sort: req.body.sort,
        })

        await category.save()

        res.json({
            status: 'success'
        })
    }
})

module.exports = router
