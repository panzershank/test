const Projects = require("../../../models/projects");
const ProjectsNotice = require("../../../models/projects-notice");
const {roleUser, typeReplica} = require("./replica.constants");
const Replica = require("../../../models/replica");
const Companies = require("../../../models/companies");
const UsersInProject = require("../../../models/users-in-project");
const ReplicaMsg = require("../../../models/replica-msg");
const ReplicaHistory = require("../../../models/replica-history");
const historyTypes = require("../../../utils/replicaHistoryTypes");
const ReplicaFields = require("../../../models/replica-fields");
const {mongo} = require("mongoose");
const moment = require("moment/moment");

const findReplica = async (query) => {
    const accessLevel = +query.user.role.accessLevel;

    // Телеграм, вывод кнопок "Подписаться на проект" и "Отправить уведомления по проекту"
    const arrTelegram = query?.project ? await subscribeTelegram(query.user, query) : null;

    const usersInProject = await UsersInProject.find({
        active: true,
        deleted: false,
        userId: query.userId
    }).populate('projectId', '_id companyId').select('projectId').lean()

    const ids = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId._id.toString())) : []

    const dateFrom = moment(query.dateFrom, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString()
    const dateTo = moment(query.dateTo, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString()

    const date = query.statusChange === "Y" ? {
        statusChange: {
            ...(dateFrom && {['$gte']: new Date(dateFrom)}),
            ...(dateTo && {['$lte']: new Date(dateTo)})
        }
    } :  {
        date: {
            ...(dateFrom && {['$gte']: new Date(dateFrom)}),
            ...(dateTo && {['$lte']: new Date(dateTo)})
        }
    }

    // Поиск активных компаний
    const foundActiveCompanies = await Companies.find({
        active: true,
        deleted: false,
    });

    // Добавляем ObjectID к активным компаниям
    const filteredActiveCompanies = foundActiveCompanies.map(item => mongo.ObjectId(item._id));

    // В БД хранятся платформы, у которых могут быть пробелы / отступы / переносы - это условие для этого сделано
    const platforms = {
        platform: {
            $in: [
                query.platform,
                ` ${query.platform}`,
                `\r\n${query.platform}`,
                `\r\n${query.platform} `,
                `\n\r${query.platform}`,
                `\r${query.platform}`,
                `\n${query.platform}`,
                ` \r${query.platform}`,
                ` \n${query.platform}`,
                `${query.platform} `,
                `${query.platform}\r\n`,
                `${query.platform}\n\r`,
                `${query.platform}\r`,
                `${query.platform}\n`,
                `${query.platform}\r `,
                `${query.platform}\n `,
                ` ${query.platform} `,
            ],
        },
    };

    // Фильтр по репликам
    const filters = {
        ...(Object.keys(date?.date || date?.statusChange).length > 0 && date),
        // по умолчанию отображением только существующие реплики
        deleted: false,
        parentId: query.parentId,

        ...(query.company ? {company: mongo.ObjectId(query.company)} : {company: {$in: filteredActiveCompanies }}),
        ...(accessLevel === 1 ? query.project && {project: mongo.ObjectId(query.project)} : {project: query.project ? mongo.ObjectId(query.project) : {$in: ids}}),
        ...({ type: +query.type ? query.type : null}),
        ...(query.platform && platforms),
        ...(query.status && {status: mongo.ObjectId(query.status)}),
        // // На вкалдке ининициаирования нет катеогории
        ...(query.category && query.type !== typeReplica.init && {category: mongo.ObjectId(query.category)}),
        ...(query.q && {
            search: {
                "$regex": query.q,
                "$options": "i"
            }
        }),
        //date или statusChange фильтр
    }


    console.log(`[findReplica] filters: ${JSON.stringify(filters)}`)


    // Подсчет количества реплик на экране с репликами (если нет активных компаний - реплики не выводятся)
    const countAllRows = filteredActiveCompanies.length ? await Replica.count(filters) : 0;


    const data = await getReplica(filters, filteredActiveCompanies, {...query, accessLevel});

    // console.log(`[findReplica] data length: ${JSON.stringify(data.length)}`)

    const result = await Promise.all(data.map(async (current) => {

        // Выбираем самое свежее сообщение внутри реплики
        const msg = await ReplicaMsg.findOne({
            replica: current._id.toString(),
            deleted: false,
        }, {_id: 1}).select('msg comment textSomeone').sort([['createdDate', -1]]).lean()


        // Выбираем чужую реплику
        const someone = await ReplicaMsg.findOne({
            replica: current._id.toString(),
            deleted: false,
        }, {_id: 1}).select('msg comment textSomeone').sort([['createdDate', 1]]).lean()


        const message = {...msg, ...(someone && someone?.textSomeone && {textSomeone: someone.textSomeone})}


        let dateEdit = null;
        // Выбираем дату редактирования реплики
        const history = await ReplicaHistory.find({
            replica: current._id.toString(),
        }).sort([['sort', -1]]).lean()

        if (history && history.length) {
            for (const historyItem of history) {
                const type = (historyItem.type && historyItem.type.toString() ? historyItem.type.toString() : false)

                if (type && historyItem.createdDate && (type === historyTypes.edit || type === historyTypes.repair)) {
                    dateEdit = historyItem.createdDate
                    break
                }
            }
        }


        let fields = [];

        // Выбираем список полей проекта
        const replicaFields = await ReplicaFields.find({
            replica: current._id.toString(),
            deleted: false,
        })
            .select('createdDate field value valueOptions')
            .populate('field', 'type name viewReplica deleted sort')
            .populate('valueOptions', 'value deleted')
            .sort([['createdDate', -1]])
            .lean()

        if (replicaFields) {
            const replicaFieldsNew = []
            const replicaFieldsIdx = {}

            for (const replicaFieldsData of replicaFields) {
                const fieldId = replicaFieldsData.field._id.toString()

                if (!replicaFieldsIdx[fieldId]) {
                    replicaFieldsIdx[fieldId] = fieldId
                    replicaFieldsNew.push(replicaFieldsData)
                }
            }

            fields = [...replicaFieldsNew]
        }


        const data = {
            _id: current._id.toString(),
            company: current.company,
            project: current.project,
            category: current.category,
            date: current.date,
            dateEdit: dateEdit,
            platform: current.platform,
            url: current.url,
            status: current.status,
            screenshot: current.screenshot,
            agentName: current.agentName,
            msg: message,
            fields: fields,
            type:  current.type,
            statusChange: current.statusChange,
            onlyView: !!query.user.onlyView,
            noteSystem: (current.noteSystem ? current.noteSystem : ''),
        }

        return data;

    }));


    // console.log(`[findReplica] query.userId: ${JSON.stringify(query.userId)}`)


    // Фильтр по репликам
    const filtersByPlatform = {
        ...(Object.keys(date?.date || date?.statusChange).length > 0 && date),
        deleted: false,
        parentId: query.parentId,

        // platform: "укажите, пожалуйста, в «комментарии» приоритетную постинга площадку",

        ...(query.company ? {company: mongo.ObjectId(query.company)} : {company: {$in: filteredActiveCompanies }}),
        // ...(query.company && {company: mongo.ObjectId(query.company)}),
        ...(accessLevel === 1 ? query.project && {project: mongo.ObjectId(query.project)} : {project: query.project ? mongo.ObjectId(query.project) : {$in: ids}}),
        ...({ type: +query.type ? query.type : null}),
        ...(query.status  && {status: mongo.ObjectId(query.status)}),
        // // На вкалдке ининициаирования нет катеогории
        ...(query.category && query.type !== typeReplica.init && {category: mongo.ObjectId(query.category)}),
        // ...(query.category  && {category: mongo.ObjectId(query.category)}),
        ...(query.q && {
            search: {
                "$regex": query.q,
                "$options": "i"
            }
        }),
    }

    // console.log(`[findReplica] filtersByPlatform: ${JSON.stringify(filtersByPlatform)}`)

    const forPlatform = await Replica.aggregate([
        {
            $match: {
                ...filtersByPlatform,
            }
        },
        {
            $addFields: {
                trimmedName: {
                    $trim: {
                        input: "$platform",  // поле, из которого нужно убрать пробелы
                        chars: " \r\n"     // символы для удаления: пробелы и переносы строк
                    }
                }
            }
        },
        {
            $group: {
                _id: "$trimmedName",
                count: {$sum: 1},
            }

        },
        {
            "$project": {
                "_id": 0,
                "id": "$_id",
                // "name": "$name",
                "count": "$count"
            }
        },
        {$sort: {id: 1, _id: 1}},
    ]).allowDiskUse(true);

    console.log(forPlatform.reduce((acc, value) => value.count + acc, 0));




    return {
        status: 'success',
        telegram: arrTelegram,
        data: result,
        meta: {
            items: countAllRows,
            // текущая страница
            currentPage: query.page,
            // количество всех страниц
            pages: countAllRows && query.view && Math.ceil(countAllRows / query.view) ? Math.ceil(countAllRows / query.view) : 1,
            // количество реплик в БД
            forPlatform,
        }
    }

}


const getReplica = async (filter, filteredActiveCompanies, params) => {
    try {
        if (filteredActiveCompanies.length === 0) {
            return [];
        }

        if (params.accessLevel === 1) {

            return await Replica.find(filter, {_id: 1})
                .select('date platform url status project company project category screenshot agentName type statusChange noteSystem')
                .populate('company', 'name')
                .populate('project', 'name')
                .populate('category', 'name')
                .populate('status', 'name code')
                .sort([[params.sortName, params.sortDirection]])
                .skip(params.page ? (params.page - 1) * params.view : 0)
                .limit(params.pageStart ? parseInt(+params.pageStart * params.view) : params.view)
                .lean()
        }

        const result = await Replica.find(filter)
            .select('date platform url status project company project category screenshot agentName type statusChange noteSystem')
            .populate('company', 'name')
            .populate('project', 'name')
            .populate('category', 'name')
            .populate('status', 'name code')
            .sort([[(params.sortName), params.sortDirection]])
            .skip(params.page ? (params.page - 1) * params.view : 0)
            .limit(params.view)
            .lean();
        return result;
    } catch (e) {
        console.error(`[replica.service] getReplica error: ${e?.message}`)
    }
}


const getPlatformsByReplica = async (filter, access) => {
    try {
        const data = await Replica.find(filter, {_id: 1})
            .select('status platform')
            .populate('status', 'name code')
            .lean()
        return data;
    } catch (e) {
        console.error(`[replica.service] getReplica error: ${e?.message}`)
    }
}


// Телеграм, вывод кнопок "Подписаться на проект" и "Отправить уведомления по проекту"
const subscribeTelegram = async (user, req) => {
    const arrTelegram = {
        showButton: null,
        counter: false,
    }
    try {
        const projects = await Projects.findOne({
            _id: req.project,
        }).lean();

        if (projects && projects._id) {
            if (user.role.accessLevel === roleUser.unknown2) {
                const projectsNotice = await ProjectsNotice.findOne({
                    project: projects._id.toString(),
                    user: user._id.toString(),
                    deleted: false,
                }).lean()

                if (!projectsNotice || (projectsNotice && !projectsNotice._id)) {
                    if (user.telegramChat) {
                        arrTelegram.showButton = 'subscribe-confirm'
                    } else {
                        arrTelegram.showButton = 'subscribe'
                    }
                }
            } else {
                const projectsNotice = await ProjectsNotice.findOne({
                    project: projects._id.toString(),
                    deleted: false,
                }).lean()

                if (projectsNotice && projectsNotice._id) {
                    arrTelegram.showButton = 'sendMessage'

                    if (projects.changes) {
                        arrTelegram.counter = true
                    }
                }
            }
        }

        return arrTelegram;
    } catch (e) {
        console.error(`[replica.service] telegram error: ${e?.message}`)
    }
}

module.exports = {findReplica, getPlatformsByReplica, subscribeTelegram}
