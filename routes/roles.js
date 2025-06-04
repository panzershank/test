const {Router}  = require('express')
const router = Router()
const Users = require('../models/users')
const Roles = require('../models/roles')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')

router.get('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const filter = {}

        if (req.query.onlyManagers === "Y") {
            filter.accessLevel = {$ne: 2}
        }

        if (req.query['f-search']) {
            const arrRoles = []

            const users = await Users.find({
                search: {
                    "$regex": req.query['f-search'],
                    "$options": "i"
                }
            })

            if (users) {
                for (const userData of users) {
                    if (userData.role) {
                        arrRoles.push(userData.role)
                    }
                }
            }

            if (arrRoles) {
                filter._id = arrRoles
            }
        }

        if (req.query['f-status']) {
            const arrRoles = []
            const filterUsers = {}

            if (req.query['f-status'] === "Y") {
                filterUsers.active = true
            } else if (req.query['f-status'] === "N") {
                filterUsers.active = false
            }

            const users = await Users.find(filterUsers)

            if (users) {
                for (const userData of users) {
                    if (userData.role) {
                        arrRoles.push(userData.role)
                    }
                }
            }

            if (arrRoles) {
                if (filter._id) {
                    const ids = []

                    for (const data of filter._id) {
                        for (const dataRole of arrRoles) {
                            if (dataRole.toString() === data.toString()) {
                                ids.push(data)
                            }
                        }
                    }

                    if (ids) {
                        filter._id = ids
                    }
                } else {
                    filter._id = arrRoles
                }
            }
        }

        const roles = await Roles.find(filter)
            .sort([['sort', 1]])

        res.json({
            status: 'success',
            data: roles
        })
    }
})

router.post('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (!req.body.name) {
        errors.push('Укажите название роли')
    }

    if (!req.body.accessLevel) {
        errors.push('Укажите уровень доступа')
    }

    if (!req.body.sort) {
        errors.push('Укажите позицию сортировки')
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const role = new Roles({
            name: req.body.name,
            accessLevel: req.body.accessLevel,
            sort: req.body.sort,
        })

        await role.save()

        res.json({
            status: 'success'
        })
    }
})

module.exports = router