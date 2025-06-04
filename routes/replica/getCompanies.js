/* ==========================================================================
   Выбираем список доступных компаний для пользователя
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const Companies = require("../../models/companies")
const UsersInProject = require("../../models/users-in-project")
const Replica = require("../../models/replica");
const {mongo} = require("mongoose");
const moment = require("moment");

const getCompanies = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token) || {}

    const company = req.query['f-company'];
    const searchInput = req.query['f-search'];
    const project = req.query['f-project'];
    const parentId = req.query.parentId ? req.query.parentId : null;
    const type = (!req.query['type'] || req.query['type'] === "null") ? null : +req.query['type'];
    const to = req.query['f-dateTo']
    const from = req.query['f-dateFrom']
    const dateFrom = moment(from, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString()
    const dateTo = moment(to, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString()
    const status = req.query['f-status']
    const category = req.query['f-category']
    const platform = req.query['f-platform']
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


    console.log("-----------------------");
    console.log("COMPANY", company);
    console.log("PROJECT", project);
    console.log("CATEGORY", category);
    console.log("PLATFORM", platform);
    console.log("DATE FROM", dateFrom);
    console.log("DATE TO", dateTo);
    console.log("STATUS", status);
    console.log("SEARCH INFO", searchInput);
    console.log("-----------------------");

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user

        // Если пользователь не админ, выбираем связи проектов с пользователями
        if (user.role.accessLevel === 1) {
            const where = [
                {$eq: ["$deleted", false]},
                {
                    $eq: [
                        "$$id",
                        "$company"
                    ]
                },
                {...(platform && {$in: ["$platform", platforms]})},
                {...(status && {$eq: ["$status", mongo.ObjectId(status)]})},
                {...(category && {$eq: ["$category", mongo.ObjectId(category)]})},
                {...(dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]})},
                {...(dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]})},
                {...{$eq: ["$type", type]}},
                {...{$eq: ["$parentId", parentId]}},
            ]
            const companies = await Companies.aggregate([
                {
                    $match: {
                        active: true,
                        deleted: false,
                    }
                },
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
                                            $and: where,
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
                // {$sort: {name: 1, _id: 1}},

                {
                    $project: {
                        _id: 0,
                        id: "$_id",
                        name: "$name",
                        search: "$search",
                        active: "$active",
                        createdBy: "$createdBy",
                        createdDate: "$createdDate",
                        deleteMsg: "$deleteMsg",
                        delete: "$delete",
                        modifiedBy: "$modifiedBy",
                        modifiedDate: "$modifiedDate",
                        "count": {
                            "$size": "$total"
                        }
                    }
                },
                {$sort: {name: 1, _id: 1}},
            ]).allowDiskUse(true);

            res.json({
                status: 'success',
                data: companies
            })
        } else {
            const usersInProject = await UsersInProject.find({
                active: true,
                deleted: false,
                userId: user._id.toString()
            }).populate('projectId', '_id companyId').select('projectId')

            const projectIds = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId._id.toString())) : [];

            const ids = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId.companyId.toString())) : [];

            // console.log(`[getCompanies] ids: ${JSON.stringify(ids)}`)

            // Выбираем список компаний, если они доступны
            if (ids.length) {

                const where = [
                    {$eq: ["$deleted", false]},
                    {
                        $eq: [
                            "$$id",
                            "$company"
                        ]
                    },
                    {...(platform && {$in: ["$platform", platforms]})},
                    {...(status && {$eq: ["$status", mongo.ObjectId(status)]})},
                    {...(category && {$eq: ["$category", mongo.ObjectId(category)]})},
                    {...(dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]})},
                    {...(dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]})},

                    // {...(dateFrom && {$gte: ["$date", new Date(dateFrom)]})},
                    // {...(dateTo && {$lte: ["$date", new Date(dateTo)]})},

                    {...{$eq: ["$type", type]}},
                    {...{$eq: ["$parentId", parentId]}},


                    {...(ids.length > 0 && {$in: ["$company", ids]})},
                    {...(projectIds.length > 0 && {$in: ["$project", projectIds]})},
                ]

                const companies = await Companies.aggregate([
                    {
                        $match: {
                            _id: {$in: ids},
                            active: true,
                            deleted: false,
                        }
                    },
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
                    {$sort: {name: 1, _id: 1}},
                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            name: "$name",
                            search: "$search",
                            active: "$active",
                            createdBy: "$createdBy",
                            createdDate: "$createdDate",
                            deleteMsg: "$deleteMsg",
                            delete: "$delete",
                            modifiedBy: "$modifiedBy",
                            modifiedDate: "$modifiedDate",
                            "count": {
                                "$size": "$total"
                            }
                        }
                    }
                ]);


                res.json({
                    status: 'success',
                    data: companies
                })
            } else {
                return res.json(getErrorData('Компании отсутствуют'))
            }
        }
    }
}

module.exports = getCompanies
