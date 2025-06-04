/* ==========================================================================
   Выбираем список доступных проектов для пользователя
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")

const UsersInProject = require("../../models/users-in-project")
const Project = require("../../models/projects");
const {mongo} = require("mongoose");
const moment = require("moment/moment");

const getProjects = async (req, res) => {
  try {
      console.log(`[controller] getProjects() req.query: ${JSON.stringify()}`)

      const errors = []
      const checkTokenResult = await checkToken(req.query.token) || {}

      if (checkTokenResult.status === 'fail') {
          errors.push(checkTokenResult.errorText)
      }

      if (errors.length) {
          return res.json(getErrorData(errors))
      } else {
          const user = checkTokenResult.user
          console.log(`[controller] getProjects() текущий пользователь с токеном ${req.query.token} и user ${JSON.stringify(user)}`)


          const searchInput = req.query['f-search'];
          const parentId = req.query.parentId ? req.query.parentId : null;
          const type = (!req.query['type'] || req.query['type'] === "null") ? null : +req.query['type'];
          const company = req.query['f-company'];
          const project = req.query['f-project'];
          const to = req.query['f-dateTo']
          const from = req.query['f-dateFrom']
          const status = req.query['f-status']
          const dateFrom = moment(from, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString()
          const dateTo = moment(to, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString()
          const category = req.query['f-category'];
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

          const filterProjects = {
              active: true,
              deleted: false,
              ...(!!req.query.type && req.query.type > 0 && {"total.type": +req.query.type})
          }



          if (req.query.companyId) {
              filterProjects.companyId = mongo.ObjectId(req.query.companyId)
          } else if (user.companyId) (
              filterProjects.companyId = mongo.ObjectId(user.companyId)
          )


          if (!filterProjects.companyId) {
              return res.json('Компания не найдена')
          }


          console.log(`[controller] getProjects() filterProjects ${JSON.stringify(filterProjects)}`)



          // Выбираем связи пользователей с проектами
          const usersInProject = await UsersInProject.find({
              active: true,
              deleted: false,
              userId: user._id.toString()
          }).select('projectId')

          console.log(`[controller] getProjects() usersInProject ${JSON.stringify(usersInProject)}`)


          // Определяем список проектов пользователя
          const ids = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId._id.toString())) : []

          console.log(`[controller] getProjects() ids ${JSON.stringify(ids)}`)

          const where = [
              {$eq: ["$deleted", false]},

              {
                  $eq: [
                      "$$id",
                      "$project"
                  ]
              },

              {...{$eq: ["$type", type]}},
              {...{$eq: ["$parentId", parentId]}},
              {...(dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]})},
              {...(dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]})},
              {...(platform && {$in: ["$platform", platforms]})},
              {...(status && {$eq: ["$status", mongo.ObjectId(status)]})},
              {...(category && {$eq: ["$category", mongo.ObjectId(category)]})},
              {...(company && {$eq: ["$company", mongo.ObjectId(company)]})},
              {...(+user.role.accessLevel === 1 ? project && {$eq: ["$project", mongo.ObjectId(project)]} : ids.length > 0 && {$in: ["$project", ids]})},
          ]

          console.log(`[controller] getProjects() where ${JSON.stringify(where)}`)


          if (ids.length === 0 && +user.role.accessLevel === 2) {
              res.json({
                  status: 'success',
                  data: [],
              })
          } else {
              const projects = await Project.aggregate([
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
                              as: "total",

                          }
                  },
                  {
                      $match: filterProjects
                  },
                  {
                      $project: {
                          _id: 0,
                          id: "$_id",
                          createdBy: "$createdBy",
                          modifiedBy: "$modifiedBy",
                          createdDate: "$createdDate",
                          modifiedDate: "$modifiedDate",
                          active: "$active",
                          deleted: "$deleted",
                          deleteMsg: "$deleteMsg",
                          changes: "$changes",
                          analysisFrequencyHide: "$analysisFrequencyHide",
                          name: "$name",
                          search: "$search",
                          count: {$size: "$total"}
                      }
                  },
                  {$sort: {name: 1, _id: 1}},
              ]).allowDiskUse(true);

              console.log(`[controller] getProjects() projects ${JSON.stringify(projects)}`)

              res.json({
                  status: 'success',
                  data: projects
              })
          }
      }
  } catch (error) {
      res.status(500).json({ error: 'Неизвестная ошибка', stackTrace: error });
      console.error(`[controller] getProjects() error: ${error?.message ?? error.toString() ?? 'unknown error'}`)
  }
}

module.exports = getProjects
