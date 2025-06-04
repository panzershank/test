const {Router}  = require('express')
const router = Router()
const generatePassword = require('password-generator')
const bcrypt = require('bcryptjs')
const Users = require('../models/users')
const Tokens = require('../models/tokens')
const checkToken = require('../utils/token')
const getErrorData = require('../utils/errors')
const addSearchContentForUser = require('../search/user')
const setActiveUser = require('../search/userActive')
const mailgun = require("mailgun-js")
const config = require("../config/index")
const nodemailer = require("nodemailer")

const emailUserPasswordChange = require("../emails/userPasswordChange")
const emailUserAdd = require("../emails/userAdd")
const emailUserDelete = require("../emails/userDelete")

// Получаем пользователей внутри компании
router.get('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.query.companyId && !req.query.roleId) {
        errors.push('Передайте ID компании или ID роли, чтобы произвести выбор')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const filter = {
            deleted: false,
        }

        if (req.query.companyId) {
            filter.companyId = req.query.companyId
        } else {
            filter.role = req.query.roleId
        }

        if (req.query['f-search']) {
            filter.search = {
                "$regex": req.query['f-search'],
                "$options": "i"
            }
        }

        if (req.query['f-status']) {
            if (req.query['f-status'] === "Y") {
                filter.active = true
            } else if (req.query['f-status'] === "N") {
                filter.active = false
            }
        }

        const users = await Users.find(filter)
            .populate('companyId', '_id name')
            .populate('role', '_id name accessLevel')
            .select('name lastName email companyId active onlyView notifyReplicaAdd notifyReplicaDelete notifyReplicaStatusChange')
            .sort([['lastName', 1]])

        res.json({
            status: 'success',
            data: users
        })
    }
})

// Создание пользователя
router.post('/', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.name) {
        errors.push('Заполните поле "Имя"')
    }

    if (!req.body.lastName) {
        errors.push('Заполните поле "Фамилия"')
    }

    if (!req.body.email) {
        errors.push('Заполните поле "Электронная почта"')
    } else {
        const email = req.body.email
        const re = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!re.test(String(email).toLowerCase())) {
            errors.push('Электронная почта указана некорректно')
        } else {
            const userCheck = await Users.findOne({
                email,
                deleted: false,
            })

            if (userCheck) {
                errors.push('Такая электронная почта уже занята')
            }
        }
    }

    if (!req.body.role) {
        req.body.role = "5f104854f249f12de0d7330b"
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const password = generatePassword(8, false)
        const hashPassword = await bcrypt.hash(password, 10)

        const user = new Users({
            createdBy: data.user._id.toString(),
            createdDate: Date.now(),
            name: req.body.name,
            lastName: req.body.lastName,
            email: req.body.email,
            companyId: req.body.companyId,
            role: req.body.role,
            password: hashPassword,
            active: false,
            onlyView: (req.body.onlyView && req.body.onlyView === "Y"),
            notifyReplicaAdd: (req.body.notifyReplicaAdd && req.body.notifyReplicaAdd === "Y"),
            notifyReplicaDelete: (req.body.notifyReplicaDelete && req.body.notifyReplicaDelete === "Y"),
            notifyReplicaStatusChange: (req.body.notifyReplicaStatusChange && req.body.notifyReplicaStatusChange === "Y"),
        })

        const transport = nodemailer.createTransport(config.SMTP_SETTINGS)
        const a = transport.sendMail(emailUserAdd({email: user.email, password}))

        await user.save()
        addSearchContentForUser(user._id.toString())
        setActiveUser(user._id.toString())

        // const mg = mailgun({apiKey: config.MAILGUN_PRIVATE_KEY, domain: config.MAILGUN_DOMAIN})
        // mg.messages().send(emailUserAdd({email: user.email, password}))

        res.json({
            status: 'success'
        })
    }
})

// Делаем пользователя редактором (и наоборот)
router.put('/only-view/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.onlyView || (req.body.onlyView && req.body.onlyView !== "N" && req.body.onlyView !== "Y")) {
        errors.push('Параметр onlyView не передан или передан с ошибкой')
    }

    if (!req.params.id) {
        errors.push('Пользователь не найден')
    } else if (req.params.id.length !== 24) {
        errors.push('ID пользователя указан неверно')
    } else {
        const user = await Users.findById(req.params.id)

        if (!user) {
            errors.push('Пользователь не найден')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = await Users.findById(req.params.id)

        user.onlyView = (req.body.onlyView === "Y")
        user.modifiedBy = data.user._id
        user.modifiedDate = Date.now()

        await user.save()

        res.json({
            status: 'success'
        })
    }
})

// Включаем уведомления пользователю (и наоборот)
router.put('/notify/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.notifyReplicaAdd || (req.body.notifyReplicaAdd && req.body.notifyReplicaAdd !== "N" && req.body.notifyReplicaAdd !== "Y")) {
        errors.push('Параметр notifyReplicaAdd не передан или передан с ошибкой')
    }

    if (!req.body.notifyReplicaDelete || (req.body.notifyReplicaDelete && req.body.notifyReplicaDelete !== "N" && req.body.notifyReplicaDelete !== "Y")) {
        errors.push('Параметр notifyReplicaDelete не передан или передан с ошибкой')
    }

    if (!req.body.notifyReplicaStatusChange || (req.body.notifyReplicaStatusChange && req.body.notifyReplicaStatusChange !== "N" && req.body.notifyReplicaStatusChange !== "Y")) {
        errors.push('Параметр notifyReplicaStatusChange не передан или передан с ошибкой')
    }

    if (!req.params.id) {
        errors.push('Пользователь не найден')
    } else if (req.params.id.length !== 24) {
        errors.push('ID пользователя указан неверно')
    } else {
        const user = await Users.findById(req.params.id)

        if (!user) {
            errors.push('Пользователь не найден')
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = await Users.findById(req.params.id)

        user.notifyReplicaAdd = (req.body.notifyReplicaAdd === "Y")
        user.notifyReplicaDelete = (req.body.notifyReplicaDelete === "Y")
        user.notifyReplicaStatusChange = (req.body.notifyReplicaStatusChange === "Y")
        user.modifiedBy = data.user._id
        user.modifiedDate = Date.now()

        await user.save()

        res.json({
            status: 'success'
        })
    }
})

// Редактирование пользователя
router.put('/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.body.token)

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (!req.body.name) {
        errors.push('Заполните поле "Имя"')
    }

    if (!req.body.lastName) {
        errors.push('Заполните поле "Фамилия"')
    }

    if (!req.body.email) {
        errors.push('Заполните поле "Электронная почта"')
    } else {
        const email = req.body.email
        const re = /^(([^<>()\\[\]\\.,;:\s@"]+(\.[^<>()\\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        if (!re.test(String(email).toLowerCase())) {
            errors.push('Электронная почта указана некорректно')
        } else {
            const userCheck = await Users.findOne({
                email,
                _id: {$ne: req.params.id},
                deleted: false,
            })

            if (userCheck) {
                errors.push('Такая электронная почта уже занята')
            }
        }
    }

    if (!req.body.role) {
        req.body.role = "5f104854f249f12de0d7330b"
    }

    const user = await Users.findById(req.params.id)

    if (!user) {
        errors.push('Пользователь не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        user.name = req.body.name
        user.lastName = req.body.lastName
        user.email = req.body.email
        user.modifiedBy = data.user._id
        user.modifiedDate = Date.now()
        user.onlyView = (req.body.onlyView && req.body.onlyView === "Y")
        user.notifyReplicaAdd = (req.body.notifyReplicaAdd && req.body.notifyReplicaAdd === "Y")
        user.notifyReplicaDelete = (req.body.notifyReplicaDelete && req.body.notifyReplicaDelete === "Y")
        user.notifyReplicaStatusChange = (req.body.notifyReplicaStatusChange && req.body.notifyReplicaStatusChange === "Y")

        await user.save()
        addSearchContentForUser(req.params.id)
        setActiveUser(req.params.id)

        res.json({
            status: 'success'
        })
    }
})

// Удаление пользователя
router.delete('/:id', async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token)

    if (req.params.id.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    const user = await Users.findById(req.params.id)

    if (!user) {
        errors.push('Пользователь не найден')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        user.deleted = true
        user.modifiedBy = data.user._id
        user.modifiedDate = Date.now()

        await user.save()

        const tokens = await Tokens.find({createdBy: user._id})

        if (tokens) {
            const ids = []

            for (const tokenData of tokens) {
                ids.push(tokenData._id.toString())
            }

            if (ids.length) {
                await Tokens.deleteMany({_id: ids})
            }
        }

        const transport = nodemailer.createTransport(config.SMTP_SETTINGS)
        transport.sendMail(emailUserDelete({email: user.email}))

        // const mg = mailgun({apiKey: config.MAILGUN_PRIVATE_KEY, domain: config.MAILGUN_DOMAIN})
        // mg.messages().send(emailUserDelete({email: user.email}))

        res.json({
            status: 'success',
        })
    }
})

// Изменяем пароль пользователя
router.put('/change-password/:userId', async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.body.token)

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (req.params.userId.length !== 24) {
        errors.push('ID указан неверно')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = await Users.findById(req.params.userId)

        if (!user) {
            return res.json(getErrorData('Пользователь не найден'))
        } else {
            const password = generatePassword(8, false)
            const hashPassword = await bcrypt.hash(password, 10)

            user.modifiedBy = checkTokenResult.user._id
            user.modifiedDate = Date.now()
            user.password = hashPassword

            await user.save()

            const tokens = await Tokens.find({createdBy: user._id})

            if (tokens) {
                const ids = []

                for (const tokenData of tokens) {
                    ids.push(tokenData._id.toString())
                }

                if (ids.length) {
                    await Tokens.deleteMany({_id: ids})
                }
            }

            const transport = nodemailer.createTransport(config.SMTP_SETTINGS);
            transport.sendMail(emailUserPasswordChange({email: user.email, password}));

            //const mg = mailgun({apiKey: config.MAILGUN_PRIVATE_KEY, domain: config.MAILGUN_DOMAIN})
            //mg.messages().send(emailUserPasswordChange({email: user.email, password}))

            res.json({
                status: 'success',
            })
        }
    }
})

router.post('/login', async (req, res) => {
    const errors = []

    if (!req.body.email) {
        errors.push('Заполните поле "Электронная почта"')
    }

    if (!req.body.password) {
        errors.push('Заполните поле "Пароль"')
    }

    if (req.body.email && req.body.password) {
        const user = await Users.findOne({email: req.body.email, deleted: false})

        if (!user) {
            errors.push('Пользователя с таким электронным адресом не существует')
        } else {
            const areSame = await bcrypt.compare(req.body.password, user.password)

            if (!areSame) {
                errors.push('Неверный пароль')
            }
        }
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = await Users.findOne({email: req.body.email, deleted: false})
            .populate('role', '_id name accessLevel')
            .populate('companyId', '_id name')

        const token = new Tokens({
            createdBy: user._id.toString(),
            createdDate: Date.now(),
            token: generatePassword(50, false),
            tokenExp: Date.now() + (60 * 60 * 24 * 1000 * 365),
        })

        await token.save()

        res.json({
            status: 'success',
            data: {
                token: token.token,
                tokenExp: token.tokenExp,
                accessLevel: user.role?.accessLevel,
                roleId: user.role?._id?.toString(),
                companyId: user.companyId?._id.toString() || null,
                id: user._id.toString(),
            }
        })
    }
})

router.get('/checkToken/:token', async (req, res) => {
    const errors = []

    if (!req.params.token) {
        errors.push('Токен не указан')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const data = await checkToken(req.params.token)

        if (data.status === 'fail') {
            return res.json(data.errorText)
        } else {
            res.json({
                status: 'success',
                data: {
                    companyId: data?.user?.companyId?.toString() || null,
                },
            })
        }
    }
})

module.exports = router
