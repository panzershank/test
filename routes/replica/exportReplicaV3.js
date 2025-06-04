/* ==========================================================================
   Экспорт данных V3
   ========================================================================== */

const XLSX = require('xlsx')
const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const Replica = require('../../models/replica')
const ReplicaMsg = require('../../models/replica-msg')
const ReplicaFields = require('../../models/replica-fields')
const service = require("./v1/replica.service");
const {mongo} = require("mongoose");
const {typeReplica} = require("./v1/replica.constants");
const UsersInProject = require("../../models/users-in-project");
const moment = require("moment");
const Companies = require("../../models/companies");

const exportReplicaV3 = async (req, res) => {
    // getting all query params from URL
    const replicaType = req.query["replicaType"];
    const company = req.query["company"];
    const project = req.query["project"];
    const category = req.query["category"];
    const platform = req.query["platform"];
    const dateFrom = req.query["dateFrom"];
    const dateTo = req.query["dateTo"];
    const status = req.query["status"];
    const search = req.query["search"];
    const filterByDateChangeStatus = req.query["filterByDateChangeStatus"];
    const sortName = req.query["sortName"];
    const sortDirection = req.query["sortDirection"];

    // error assembly
    const errors = [];

    // token verification (getting user data)
    const checkTokenResult = await checkToken(req.query.token) || {};

    // if you get a fail when checking the token
    if (checkTokenResult.status === "fail") errors.push(checkTokenResult.errorText);

    // if the replica type is not specified
    if (!replicaType) errors.push("Тип выгрузки не указан");

    // if there are errors at this stage - return
    if (errors.length) {
        return res.json(getErrorData(errors));
    }

    // getting userId
    const userId = checkTokenResult.user._id;

    // getting role
    const accessLevel = +checkTokenResult.user.role.accessLevel;

    // getting projects that the user is a part of
    const usersInProject = await UsersInProject.find({
        active: true,
        deleted: false,
        userId,
    })
        .populate('projectId', '_id companyId')
        .select('projectId')
        .lean();

    // getting project IDs
    const ids = usersInProject ? usersInProject.map(project => mongo.ObjectId(project.projectId._id.toString())) : [];

    // date conversions FROM and TO
    const dateFromISO = moment(dateFrom, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString();
    const dateToISO = moment(dateTo, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString();

    // date selection
    const date = filterByDateChangeStatus ? {
        statusChange: {
            ...(dateFromISO && {['$gte']: new Date(dateFromISO)}),
            ...(dateToISO && {['$lte']: new Date(dateToISO)})
        }
    } :  {
        date: {
            ...(dateFromISO && {['$gte']: new Date(dateFromISO)}),
            ...(dateToISO && {['$lte']: new Date(dateToISO)})
        }
    }

    // search for active companies
    const foundActiveCompanies = await Companies.find({
        active: true,
        deleted: false,
    });

    // adding ObjectID to Active Companies
    const filteredActiveCompanies = foundActiveCompanies.map(item => mongo.ObjectId(item._id));

    // the DB stores platforms that may have spaces/indents/hyphens - this is the condition for this
    const platforms = {
        platform: {
            $in: [
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
            ],
        },
    };

    // filters by replicas
    const filters = {
        ...(Object.keys(date?.date || date?.statusChange).length > 0 && date),
        // по умолчанию отображением только существующие реплики
        deleted: false,
        parentId: null,

        ...(company ? {company: mongo.ObjectId(company)} : {company: {$in: filteredActiveCompanies }}),
        ...(accessLevel === 1 ? project && {project: mongo.ObjectId(project)} : {project: project ? mongo.ObjectId(project) : {$in: ids}}),
        ...({ type: +replicaType ? replicaType : null}),
        ...(platform && platforms),
        ...(status && {status: mongo.ObjectId(status)}),
        // // На вкалдке ининициаирования нет катеогории
        ...(category && replicaType !== typeReplica.init && {category: mongo.ObjectId(category)}),
        ...(search && {
            search: {
                "$regex": search,
                "$options": "i"
            }
        }),
    }

    // function to get all replicas
    const getAllReplica = async (filters, filteredActiveCompanies, sortName, sortDirection) => {
        const direction = sortDirection === "desc" ? -1 : 1;

        try {
            if (filteredActiveCompanies.length === 0) {
                return [];
            }

            if (accessLevel === 1) {
                return await Replica.find(filters, {_id: 1})
                    .select('date platform url status project company project category screenshot agentName type statusChange noteSystem')
                    .populate('company', 'name')
                    .populate('project', 'name')
                    .populate('category', 'name')
                    .populate('status', 'name')
                    .sort([[sortName, direction]])
                    .lean()
            }

            return await Replica.find(filters)
                .select('date platform url status project company project category screenshot agentName type statusChange noteSystem')
                .populate('company', 'name')
                .populate('project', 'name')
                .populate('category', 'name')
                .populate('status', 'name code')
                .sort([[(sortName), direction]])
                .lean();
        } catch (error) {
            console.error(`[replica.service] getReplica error: ${error?.message}`);
        }
    };

    // getting information about all replicas in the sample
    const allReplicaData = await getAllReplica(filters, filteredActiveCompanies, sortName, sortDirection);

    // fetch all replica IDs
    const allReplicaDataIds = allReplicaData.map(item => item._id.toString());

    // search for replica messages by IDs
    const searchAllReplicaMessagesByIds = async (replicaIds) => {
        return await ReplicaMsg.find({
            replica: { $in: replicaIds },
            deleted: false,
        }, {_id: 0})
            .select('msg comment textSomeone replica')
            .sort([['createdDate', -1]])
            .lean();
    };

    // search for additional fields of replicas by IDs
    const searchAllReplicaFieldsByIds = async (replicaIds) => {
        return await ReplicaFields.find({
            replica: { $in: replicaIds },
            deleted: false,
        })
            .select('createdDate field value valueOptions replica')
            .populate('field', 'type name viewReplica deleted sort')
            .populate('valueOptions', 'value deleted')
            .sort([['field.sort', 1]])
    };

    const searchedAllReplicaMessages = await searchAllReplicaMessagesByIds(allReplicaDataIds);
    const searchedAllReplicaFields = await searchAllReplicaFieldsByIds(allReplicaDataIds);

    // add messages and additional fields to replicas
    const allReplicaDataWithMessagesAndFields = allReplicaData.map((item, index) => {
        return {
            ...item,
            replicaMessages: searchedAllReplicaMessages.filter(message => message.replica.toString() === item._id.toString()),
            fields: searchedAllReplicaFields.filter(field => field.replica.toString() === item._id.toString()),
        }
    });

    // result data
    const result = allReplicaDataWithMessagesAndFields.map((current, index) => {
        const lastMessage = current.replicaMessages[0];
        const someone = current.replicaMessages[current.replicaMessages.length - 1];

        let fields = [];

        current.fields.map(fieldData => {
            let fieldName = (fieldData.field.name ? fieldData.field.name : (fieldData.field.type === 'url' ? 'URL' : ''));
            const fieldValue = (fieldData.field.type === 'select' ? fieldData.valueOptions.value : fieldData.value);

            if (fieldData.field.type === 'note') {
                fieldName = `Примечание (для ${fieldData.field.name === 'agency' ? 'агентства' : 'клиента'})`
            }

            fields.push(fieldName + ': ' + fieldValue)
        });

        return {
            "№": index + 1,
            "Дата создания": moment(current.date).format("DD.MM.YYYY") ?? "-",
            "Компания": current.company?.name?.trim() ?? "-",
            "Проект": current.project?.name?.trim() ?? "-",
            "Категория": current.category?.name?.trim() ?? "-",
            "Статус": current.status?.name?.trim() ?? "-",
            "Площадка": current.platform?.trim() ?? "-",
            "URL": current.url?.trim() ?? "-",
            "Имя агента": current.agentName?.trim() ?? "-",
            "Главная реплика": !current.parentId ? "Да" : "Нет",
            "Чужая реплика": someone?.textSomeone?.trim().length > 0 ? someone?.textSomeone?.trim() : "-",
            "Последняя реплика": lastMessage?.msg?.trim().length > 0 ? lastMessage?.msg?.trim() : "-",
            "Последний комментарий клиента": lastMessage?.comment?.trim().length > 0 ? lastMessage?.comment?.trim() : "-",
            "Скриншот": current.screenshot?.trim() ?? "-",
            "Дата изменения статуса": moment(current.statusChange).format("DD.MM.YYYY") ?? "-",
            "Дополнительные поля": fields.length ? fields.join(";\n") : "-",
        };
    });

    if (allReplicaData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(result);
        const wb = XLSX.utils.book_new();

        ws['!cols'] = [
            {wpx: 50},
            {wpx: 100},
            {wpx: 150},
            {wpx: 350},
            {wpx: 200},
            {wpx: 200},
            {wpx: 200},
            {wpx: 400},
            {wpx: 250},
            {wpx: 100},
            {wpx: 500},
            {wpx: 500},
            {wpx: 500},
            {wpx: 300},
            {wpx: 200},
            {wpx: 500},
        ];

        XLSX.utils.book_append_sheet(wb, ws, "replica");

        const buf = XLSX.write(wb, {type: 'buffer', bookType: "xlsx"});

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader("Content-Disposition", "attachment; filename=replica.xlsx");
        res.status(200).send(buf);
    } else {
        res.status(200).send('Релики не найдены');
    }

    //
    //     if (replica.length) {
    //         const replicaExport = []
    //         const replicaCopy = []
    //
    //         for (const replicaData of replica) {
    //             const data = {
    //                 _id: replicaData._id.toString(),
    //                 date: replicaData.date,
    //                 company: replicaData.company.name,
    //                 project: replicaData.project.name,
    //                 category: (replicaData.category ? replicaData.category.name : '-'),
    //                 status: replicaData.status.name,
    //                 platform: replicaData.platform,
    //                 url: replicaData.url,
    //                 lastMsg: false,
    //                 fields: [],
    //                 parentId: replicaData.parentId,
    //                 agentName: replicaData.agentName,
    //                 screenshot: replicaData.screenshot,
    //                 statusChange: replicaData.statusChange,
    //             }
    //
    //             // Выбираем самое свежее сообщение внутри реплики
    //             const replicaMsg = await ReplicaMsg.findOne({
    //                 replica: data._id,
    //                 deleted: false,
    //             }).select('msg comment').sort([['createdDate', -1]])
    //
    //             if (replicaMsg) {
    //                 data.lastMsg = replicaMsg.msg
    //             }
    //
    //             // Выбираем чужую реплику
    //             const replicaMsg2 = await ReplicaMsg.findOne({
    //                 replica: data._id,
    //                 deleted: false,
    //             }).select('msg comment textSomeone').sort([['createdDate', 1]])
    //
    //             if (replicaMsg2) {
    //                 data.textSomeone = replicaMsg2.textSomeone
    //             }
    //
    //             // Выбираем список полей проекта
    //             const replicaFields = await ReplicaFields.find({
    //                 replica: data._id,
    //                 deleted: false,
    //             })
    //                 .select('createdDate field value valueOptions')
    //                 .populate('field', 'type name viewReplica deleted sort')
    //                 .populate('valueOptions', 'value deleted')
    //                 .sort([['field.sort', 1]])
    //
    //             if (replicaFields) {
    //                 data.fields = replicaFields
    //             }
    //
    //             if (replicaData.type !== 2) {
    //                 replicaCopy.push(data)
    //             }
    //
    //
    //             // Собираем дочерние реплики
    //             const filterChild = {...filter}
    //             filterChild.parentId = replicaData._id.toString()
    //
    //             const replicaChildren = await Replica.find(filterChild)
    //                     .populate('status')
    //                     .populate('company')
    //                     .populate('project')
    //                     .populate('category')
    //                     .sort([['date', 1]])
    //                 || []
    //
    //             if (replicaChildren.length) {
    //                 for (const replicaDataChildren of replicaChildren) {
    //                     const dataChildren = {
    //                         _id: replicaDataChildren._id.toString(),
    //                         date: replicaDataChildren.date,
    //                         company: replicaDataChildren.company.name,
    //                         project: replicaDataChildren.project.name,
    //                         category: (replicaDataChildren.category ? replicaDataChildren.category.name : '-'),
    //                         status: replicaDataChildren.status.name,
    //                         platform: replicaDataChildren.platform,
    //                         url: replicaDataChildren.url,
    //                         lastMsg: false,
    //                         fields: [],
    //                         parentId: replicaDataChildren.parentId,
    //                         agentName: replicaDataChildren.agentName,
    //                         screenshot: replicaDataChildren.screenshot,
    //                         statusChange: replicaDataChildren.statusChange,
    //                     }
    //
    //                     // Выбираем самое свежее сообщение внутри реплики
    //                     const replicaMsgChildren = await ReplicaMsg.findOne({
    //                         replica: dataChildren._id,
    //                         deleted: false,
    //                     }).select('msg comment').sort([['createdDate', -1]])
    //
    //                     if (replicaMsgChildren) {
    //                         dataChildren.lastMsg = replicaMsgChildren.msg
    //                     }
    //
    //                     // Выбираем список полей проекта
    //                     const replicaFieldsChildren = await ReplicaFields.find({
    //                         replica: dataChildren._id,
    //                         deleted: false,
    //                     })
    //                         .select('createdDate field value valueOptions')
    //                         .populate('field', 'type name viewReplica deleted sort')
    //                         .populate('valueOptions', 'value deleted')
    //                         .sort([['field.sort', 1]])
    //
    //                     if (replicaFieldsChildren) {
    //                         dataChildren.fields = replicaFieldsChildren
    //                     }
    //
    //                     replicaCopy.push(dataChildren)
    //                 }
    //             }
    //         }
    //
    //         replicaCopy.map(replicaData => {
    //             const fields = []
    //
    //             replicaData.fields.map(fieldData => {
    //                 let fieldName = (fieldData.field.name ? fieldData.field.name : (fieldData.field.type === 'url' ? 'URL' : ''))
    //                 const fieldValue = (fieldData.field.type === 'select' ? fieldData.valueOptions.value : fieldData.value)
    //
    //                 if (fieldData.field.type === 'note') {
    //                     fieldName = `Примечание (для ${fieldData.field.name === 'agency' ? 'агентства' : 'клиента'})`
    //                 }
    //
    //                 fields.push(fieldName + ': ' + fieldValue)
    //             })
    //
    //             replicaExport.push({
    //                 'Дата создания' : replicaData.date,
    //                 'Компания' : replicaData.company,
    //                 'Проект' : replicaData.project,
    //                 'Категория' : replicaData.category,
    //                 'Статус' : replicaData.status,
    //                 'Площадка' : replicaData.platform,
    //                 'URL' : replicaData.url,
    //                 'Имя агента' : (replicaData.agentName ? replicaData.agentName : '-'),
    //                 'Главная реплика': (!replicaData.parentId ? 'Да' : ''),
    //                 'Чужая реплика' : (replicaData.textSomeone ? replicaData.textSomeone : ''),
    //                 'Последняя реплика' : replicaData.lastMsg,
    //                 'Скриншот' : (replicaData.screenshot ? replicaData.screenshot : ''),
    //                 'Дата изменения статуса' : (replicaData.statusChange ? replicaData.statusChange : ''),
    //                 'Дополнительные поля' : fields.join("; "),
    //             })
    //         })
    //
    //         const ws = XLSX.utils.json_to_sheet(replicaExport)
    //         const wb = XLSX.utils.book_new()
    //
    //         ws['!cols'] = [
    //             {wpx: 100},
    //             {wpx: 150},
    //             {wpx: 150},
    //             {wpx: 200},
    //             {wpx: 100},
    //             {wpx: 150},
    //             {wpx: 200},
    //             {wpx: 200},
    //             {wpx: 100},
    //             {wpx: 300},
    //             {wpx: 300},
    //             {wpx: 300},
    //             {wpx: 130},
    //             {wpx: 300},
    //         ]
    //
    //         XLSX.utils.book_append_sheet(wb, ws, "People")
    //         //XLSX.writeFile(wb, "sheetjs.xlsx")
    //
    //         const buf = XLSX.write(wb, {type: 'buffer', bookType: "xlsx"})
    //
    //         res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    //         res.setHeader("Content-Disposition", "attachment; filename=replica.xlsx")
    //         res.status(200).send(buf)
    //     } else {
    //         res.status(200).send('Релики не найдены')
    //     }
    // }
}

module.exports = exportReplicaV3
