const {Router}  = require('express')
const router = Router()
const Companies = require('../models/companies')
const Projects = require('../models/projects')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')
const addSearchContentForCompany = require('../search/company')
const addSearchContentForProject = require('../search/project')
const setActiveUser = require('../search/userActive')

router.get('/', async (req, res) => {
    const errors = []
    const {token, companyId} = req.query
    const data = await checkToken(token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!companyId) {
        errors.push('Компания не найдена')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const filter = {
            companyId: companyId,
            deleted: false,
        }

        if (req.query['f-search']) {
            filter.search = {
                "$regex": req.query['f-search'],
                "$options": "i"
            }
        }

        if (req.query.active !== 'all') {
            filter.active = true
        }

        const projects = await Projects.find(filter)
            .populate('companyId', '_id name')
            .select('createdBy name active companyId')
            .sort([['name', 1]])

        res.json({
            status: 'success',
            data: projects
        })
    }
})

router.post('/', async (req, res) => {
    const errors = []
    const {token, name, companyId} = req.body
    const data = await checkToken(token)

    if (!name) {
        errors.push('Укажите название проекта')
    }

    if (!companyId) {
        errors.push('Компания не найдена')
    } else if (companyId.length !== 24) {
        errors.push('ID компании указан неверно')
    } else {
        const company = await Companies.findById(companyId)

        if (!company) {
            errors.push('Компания не найдена')
        }
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = data.user

        const project = new Projects({
            createdBy: user._id.toString(),
            createdDate: Date.now(),
            name: name,
            companyId: companyId,
        })

        await project.save()
        addSearchContentForProject(project._id.toString())
        addSearchContentForCompany(companyId)

        const projectDetail = await Projects.findById(project._id.toString())
            .populate('companyId', '_id name')
            .select('createdBy name active companyId')

        res.json({
            status: 'success',
            data: projectDetail
        })
    }
})

router.put('/:id', async (req, res) => {
    const errors = []
    const {token, name, active} = req.body
    const data = await checkToken(token)

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (typeof name !== 'undefined' && !name) {
        errors.push('Введите название проекта')
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    const project = await Projects.findById(req.params.id)

    if (!project) {
        errors.push('Проект не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        if (name) {
            project.name = name
        }

        if (typeof active !== 'undefined') {
            project.active = active
        }

        project.modifiedBy = data.user._id
        project.modifiedDate = Date.now()

        await project.save()
        addSearchContentForProject(req.params.id)
        addSearchContentForCompany(project.companyId)
        setActiveUser()

        res.json({
            status: 'success',
            data: {}
        })
    }
})

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

    const project = await Projects.findById(req.params.id)

    if (!project) {
        errors.push('Проект не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        project.deleted = true
        project.deleteMsg = req.query.msg
        project.modifiedBy = data.user._id
        project.modifiedDate = Date.now()

        await project.save()

        res.json({
            status: 'success',
        })
    }
})

module.exports = router