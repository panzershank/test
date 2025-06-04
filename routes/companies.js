const {Router} = require('express')
const router = Router()
const Users = require('../models/users')
const Companies = require('../models/companies')
const Projects = require('../models/projects')
const UsersInProject = require('../models/users-in-project')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')
const addSearchContentForCompany = require('../search/company')
const setActiveUser = require('../search/userActive')
const {mongo} = require("mongoose");

// Выбираем список всех компаний, для админки
router.get('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)
    const user = data.user

    if (data.status === 'fail') {
        errors.push(data.errorText)

        return res.json({
            status: 'fail',
            errorText: errors.join(', ')
        })
    } else {
        const filter = {
            deleted: false,
            ...(!!req.query['f-search'] && {
                "$regex": req.query['f-search'],
                "$options": "i"
            }),

            ...(req.query.active !== 'all' && {active: true})

        }

        const filterUsers = {deleted: false, companyId: {$ne: null}}


        // Выбираем связи пользователей с проектами
        const usersInProject = await UsersInProject.find({
            active: true,
            deleted: false,
            userId: user._id.toString()
        }).populate('projectId', '_id companyId').select('projectId')


        const users = await Users.find(filterUsers);


        const idsss = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId.companyId.toString())) : []

        

        const globalfilter = {
            ...filter,
            ...(+user.role.accessLevel !== 1 && {_id: {$in: idsss}})
        }

        const companies = await Companies.find(globalfilter)
            .select('name active')
            .sort([['name', 1]])

        res.json({
            status: 'success',
            data: companies
        })
    }
})

// Выбираем компанию по ID, возможно удалим
// router.get('/:id', async (req, res) => {
//     const errors = []
//     const data = await checkToken(req.query.token)
//
//     if (req.params.id.length !== 24) {
//         errors.push('ID указан неверно')
//     }
//
//     if (data.status === 'fail') {
//         errors.push(data.errorText)
//     }
//
//     if (errors.length) {
//         return res.json({
//             status: 'fail',
//             errorText: errors.join(', ')
//         })
//     } else {
//         const companies = await Companies.findById(req.params.id)
//             .select('name active')
//
//         res.json({
//             status: 'success',
//             data: companies
//         })
//     }
// })

// Добавление компании, для админки
router.post('/', async (req, res) => {
    const errors = []
    const {token, name} = req.body
    const data = await checkToken(token)

    if (!name) {
        errors.push('Укажите название компании')
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json({
            status: 'fail',
            errorText: errors.join(', ')
        })
    } else {
        const user = data.user

        const company = new Companies({
            createdBy: user._id.toString(),
            createdDate: Date.now(),
            name: name,
        })

        await company.save()
        addSearchContentForCompany(company._id.toString())

        res.json({
            status: 'success',
            data: {
                id: company._id.toString(),
                name: company.name,
                active: company.active,
            }
        })
    }
})

// Редактирование компании, для админки
router.put('/:id', async (req, res) => {
    const errors = []
    const {token, name, active} = req.body
    const data = await checkToken(token)

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (typeof name !== 'undefined' && !name) {
        errors.push('Введите название компании')
    }

    const company = await Companies.findById(req.params.id)

    if (!company) {
        errors.push('Компания не найдена')
    }

    if (errors.length) {
        return res.json({
            status: 'fail',
            errorText: errors.join(', ')
        })
    } else {
        if (name) {
            company.name = name
        }

        if (typeof active !== 'undefined') {
            company.active = active
        }

        company.modifiedBy = data.user._id
        company.modifiedDate = Date.now()

        await company.save()
        addSearchContentForCompany(req.params.id)
        setActiveUser()

        res.json({
            status: 'success',
            data: {
                id: company._id.toString(),
                name: company.name,
                active: company.active,
            }
        })
    }
})

// Удаление компании, для админки
router.delete('/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.query.msg) {
        errors.push('Укажите причину удаления')
    }

    const companies = await Companies.findById(req.params.id)

    if (!companies) {
        errors.push('Компания не найдена')
    }

    if (errors.length) {
        return res.json({
            status: 'fail',
            errorText: errors.join(', ')
        })
    } else {
        companies.deleted = true
        companies.deleteMsg = req.query.msg
        companies.modifiedBy = data.user._id
        companies.modifiedDate = Date.now()

        await companies.save()

        res.json({
            status: 'success',
        })
    }
})

module.exports = router
