const express = require('express')
const path = require('path')
const config = require('./config')
const mongoose = require('mongoose')
const helmet = require('helmet')
const compression = require('compression')
const cors = require('cors')
const bodyparser = require('body-parser')

const usersRoutes = require('./routes/users')
const companiesRoutes = require('./routes/companies')
const projectsRoutes = require('./routes/projects')
const rolesRoutes = require('./routes/roles')
const usersInProjectRoutes = require('./routes/users-in-project')
const statusesRoutes = require('./routes/statuses')
const replicaRoutes = require('./routes/replica/')
const categoriesRoutes = require('./routes/categories')
const desktopRoutes = require('./routes/desktop/')
const searchRoutes = require('./routes/search/')
const searchThirdServiceRoutes = require('./routes/search-third-service');
const scriptsRoutes = require('./routes/scripts')
const planRoutes = require('./routes/plan/')
const planRoutesV2 = require('./routes/plan-v2/')
const telegramRoutes = require('./routes/telegram/')
const analysisRoutes = require('./routes/analysis/')
const searchingQueriesRoutes = require("./routes/searching-queries");
const searchingQueryResultsRoutes = require("./routes/searching-query-results");
const fs = require("fs");
// const fileupload = require("express-fileupload")

const app = express()
//
// const corsOptions = {
//     origin: ["https://test-orm.ru", "http://test-orm.ru", "https://orm.amdg.ru", "http://orm.amdg.ru", "http://localhost:4200"],
//     optionsSuccessStatus: 200 // For legacy browser support
// }
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use('/files', express.static(path.join(__dirname, 'files')))
app.use(express.urlencoded({extended: true}))
// app.use(fileupload());

app.use(helmet())
app.use(compression())
app.use(cors())
app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())

app.use('/users', usersRoutes)
app.use('/companies', companiesRoutes)
app.use('/projects', projectsRoutes)
app.use('/roles', rolesRoutes)
app.use('/users-in-project', usersInProjectRoutes)
app.use('/statuses', statusesRoutes)
app.use('/replica', replicaRoutes)
app.use('/categories', categoriesRoutes)
app.use('/desktop', desktopRoutes)
app.use('/search', searchRoutes)
app.use('/search-third-service', searchThirdServiceRoutes)
app.use('/scripts', scriptsRoutes)
app.use('/plan', planRoutes)
app.use('/plan-v2', planRoutesV2)
app.use('/telegram', telegramRoutes)
app.use('/analysis', analysisRoutes)
app.use('/searching-queries', searchingQueriesRoutes)
app.use('/searching-query-results', searchingQueryResultsRoutes);

const PORT = process.env.PORT || 4200

// Создаем поток для записи ошибок
const errorStream = fs.createWriteStream(path.join(__dirname, 'errors.log'), { flags: 'a' });

// Перехватываем ошибки
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    errorStream.write(`[${new Date().toISOString()}] Uncaught Exception: ${err.stack}\n`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    errorStream.write(`[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`);
});

async function start() {
    try {
        await mongoose.connect(config.MONGODB_URI_DEV, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        })

        app.listen(PORT)
    } catch (e) {
        console.log(e)
    }
}

start()


