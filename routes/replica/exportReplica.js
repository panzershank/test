/* ==========================================================================
   Экспорт данных
   ========================================================================== */

const XLSX = require('xlsx')
const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const Replica = require('../../models/replica')
const ReplicaMsg = require('../../models/replica-msg')
const ReplicaFields = require('../../models/replica-fields')

const exportReplica = async (req, res) => {
    const errors = []
    const checkTokenResult = await checkToken(req.query.token) || {}

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText)
    }

    if (!req.query.replica) {
        errors.push('Реплики не указаны')
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const replicaList = req.query.replica.split(';')

        const replica = await Replica.find({
            _id: replicaList,
            deleted: false,
        })
            .populate('status')
            .populate('company')
            .populate('project')
            .populate('category')
            .sort([['date', -1]])

        if (replica.length) {
            const replicaExport = []
            const replicaCopy = []

            for (const replicaData of replica) {
                const data = {
                    _id: replicaData._id.toString(),
                    date: replicaData.date,
                    company: replicaData.company.name,
                    project: replicaData.project.name,
                    category: (replicaData.category ? replicaData.category.name : '-'),
                    status: replicaData.status.name,
                    platform: replicaData.platform,
                    url: replicaData.url,
                    lastMsg: false,
                    fields: []
                }

                // Выбираем самое свежее сообщение внутри реплики
                const replicaMsg = await ReplicaMsg.findOne({
                    replica: data._id,
                    deleted: false,
                }).select('msg comment').sort([['createdDate', -1]])

                if (replicaMsg) {
                    data.lastMsg = replicaMsg.msg
                }

                // Выбираем список полей проекта
                const replicaFields = await ReplicaFields.find({
                    replica: data._id,
                    deleted: false,
                })
                    .select('createdDate field value valueOptions')
                    .populate('field', 'type name viewReplica deleted sort')
                    .populate('valueOptions', 'value deleted')
                    .sort([['field.sort', 1]])

                if (replicaFields) {
                    data.fields = replicaFields
                }

                replicaCopy.push(data)
            }

            replicaCopy.map(replicaData => {
                const fields = []

                replicaData.fields.map(fieldData => {
                    const fieldName = (fieldData.field.name ? fieldData.field.name : (fieldData.field.type === 'url' ? 'URL' : ''))
                    const fieldValue = (fieldData.field.type === 'select' ? fieldData.valueOptions.value : fieldData.value)

                    fields.push(fieldName + ': ' + fieldValue)
                })

                replicaExport.push({
                    'Дата создания' : replicaData.date,
                    'Компания' : replicaData.company,
                    'Проект' : replicaData.project,
                    'Категория' : replicaData.category,
                    'Статус' : replicaData.status,
                    'Площадка' : replicaData.platform,
                    'URL' : replicaData.url,
                    'Последняя реплика' : replicaData.lastMsg,
                    'Дополнительные поля' : fields.join("; "),
                })
            })

            const ws = XLSX.utils.json_to_sheet(replicaExport)
            const wb = XLSX.utils.book_new()

            ws['!cols'] = [
                {wpx: 100},
                {wpx: 150},
                {wpx: 150},
                {wpx: 200},
                {wpx: 100},
                {wpx: 150},
                {wpx: 200},
                {wpx: 300},
                {wpx: 300},
            ]

            XLSX.utils.book_append_sheet(wb, ws, "People")
            //XLSX.writeFile(wb, "sheetjs.xlsx")

            const buf = XLSX.write(wb, {type: 'buffer', bookType: "xlsx"})

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            res.setHeader("Content-Disposition", "attachment; filename=replica.xlsx")
            res.status(200).send(buf)
        } else {
            res.status(200).send('Релики не найдены')
        }
    }
}

module.exports = exportReplica