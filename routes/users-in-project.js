const {Router}  = require('express')
const router = Router()
const Projects = require('../models/projects')
const Users = require('../models/users')
const UsersInProject = require('../models/users-in-project')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')
const setActiveUser = require('../search/userActive')
const config = require("../config/index")
const nodemailer = require("nodemailer")
const emailUserInProjectDelete = require("../emails/userInProjectDelete")

 const toArrayString = (value) => {
    if (!!value || value.length === 0) return [];

    if (value.length === 1) return value.split('');

    return value.split(',');
};


router.get('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.query.projectId) {
        errors.push('ID проекта не указан')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const filter = {
            projectId: req.query.projectId,
            deleted: false,
        }

        const usersInProject = await UsersInProject.find(filter)
            .populate('projectId', '_id name')
            .populate({
                path: 'userId',
                select: '_id name lastName email role deleted',
                populate: {
                    path: 'role',
                    select: '_id name accessLevel',
                }
            })
            .select('createdBy active projectId userId')
            .sort([['createdBy', 1]])

        const usersPrint = []

        for (let user of usersInProject) {
            if (user.userId && !user.userId.deleted) {
                usersPrint.push(user)
            }
        }

        res.json({
            status: 'success',
            data: usersPrint
        })
    }
})

router.get('/users-for-add', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.query.roleId) {
        errors.push('Выберите роль')
    }

    if (!req.query.companyId) {
        errors.push('Выберите компанию')
    }

    if (!req.query.projectId) {
        errors.push('Выберите проект')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const filter = {
            deleted: false,
            role: req.query.roleId,
            $or: [
                {companyId: null},
                {companyId: req.query.companyId},
            ],
        }

        const users = await Users.find(filter)
            .populate('role', '_id name')
            .select('name lastName email role')
            .sort([['lastName', 1]])

        const usersInProject = await UsersInProject.find({
            deleted: false,
            projectId: req.query.projectId,
        }).select('projectId userId')

        const usersActual = []

        users.map(user => {
            let error = false

            usersInProject.map(link => {
                if (link.userId.toString() === user._id.toString()) {
                    error = true
                }
            })

            if (!error) {
                usersActual.push(user)
            }
        })

        res.json({
            status: 'success',
            data: usersActual
        })
    }
})

router.post('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.projectId) {
        errors.push('Проект не выбран')
    } else if (req.body.projectId.length !== 24) {
        errors.push('ID проекта указан неверно')
    } else {
        const project = await Projects.findById(req.body.projectId)

        if (!project) {
            errors.push('Проект не найден')
        }
    }

    if (!req.body.userId) {
        errors.push('Пользователь не выбран')
    } else if (req.body.userId.length !== 24) {
        errors.push('ID пользователя указан неверно')
    } else {
        const user = await Users.findById(req.body.userId)

        if (!user) {
            errors.push('Пользователь не найден')
        }
    }

    if (req.body.projectId && req.body.userId) {
        const usersInProject = await UsersInProject.find({
            deleted: false,
            projectId: req.body.projectId,
            userId: req.body.userId,
        })

        if (usersInProject.length) {
            errors.push('Выбранный пользователь уже привязан к проекту')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const usersInProject = new UsersInProject({
            createdBy: data.user._id.toString(),
            createdDate: Date.now(),
            projectId: req.body.projectId,
            userId: req.body.userId,
        })

        await usersInProject.save()
        setActiveUser(req.body.userId)

        res.json({
            status: 'success',
        })
    }
})

router.post('/allow', async (req, res) => {
    try {
        const bodySchema = z.object({
            projectId: z.coerce.string(),
            allow: z.coerce.boolean(),
            users: z.coerce.string(),
            token: z.coerce.string(),
        });

        const body = bodySchema.parse(req.body);

        const decode = await checkToken(body.token)

        if (!decode) {
            res.status(400).json({
                status: 'failed',
                message: "Error validate token",
                data: []
            })
        }

        const ids = toArrayString(body.users);


        await Promise.all(ids.map(async (userId) => {
            await UsersInProject.update({
                deleted: false,
                projectId: body.projectId,
                userId
            }, {"$set":{ allow: body.allow }});
        }))


        res.status(200).json({
            status: 'success',
            data: []
        })
    } catch (error) {
        console.error(`[error] allow ошибка: ${error?.message || error.toString()  || 'unknown error'}`)

    }
})

router.put('/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (!req.body.active) {
        errors.push('Активность не указана')
    }

    const usersInProject = await UsersInProject.findById(req.params.id)

    if (!usersInProject) {
        errors.push('Связь пользователя с проектом не найдена')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        usersInProject.active = (req.body.active === "Y")
        usersInProject.modifiedBy = data.user._id
        usersInProject.modifiedDate = Date.now()

        await usersInProject.save()
        setActiveUser(usersInProject.userId)

        res.json({
            status: 'success',
        })
    }
})

router.delete('/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (!req.query.msg) {
        errors.push('Укажите причину удаления')
    }

    const usersInProject = await UsersInProject.findById(req.params.id)

    if (!usersInProject) {
        errors.push('Связь пользователя с проектом не найдена')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        usersInProject.deleted = true
        usersInProject.deleteMsg = req.query.msg
        usersInProject.modifiedBy = data.user._id
        usersInProject.modifiedDate = Date.now()

        await usersInProject.save()
        setActiveUser(usersInProject.userId)


        const usersInProjectData = await UsersInProject.findOne({
            _id: usersInProject._id.toString()
        })
            .select('userId projectId')
            .populate({
                path: 'userId',
                select: '_id name lastName email role',
                populate: {
                    path: 'role',
                    select: '_id name',
                }
            })
            .populate({
                path: 'projectId',
                select: '_id name companyId',
                populate: {
                    path: 'companyId',
                    select: '_id name',
                }
            })

        if (usersInProjectData) {
            const emailOptions = {
                email: usersInProjectData.userId.email,
                company: usersInProjectData.projectId.companyId.name,
                project: usersInProjectData.projectId.name,
                role: usersInProjectData.userId.role.name,
            }

            const transport = nodemailer.createTransport(config.SMTP_SETTINGS)
            transport.sendMail(emailUserInProjectDelete(emailOptions))
        }

        res.json({
            status: 'success',
        })
    }
})

module.exports = router
