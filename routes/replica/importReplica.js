/* ==========================================================================
   Импорт данных
   ========================================================================== */

const fs = require('fs')
const XLSX = require('xlsx')
const formidable = require('formidable')
const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const Replica = require('../../models/replica')
const ReplicaMsg = require('../../models/replica-msg')
const statusesList = require('../../utils/statuses')
const addSearchContentForReplica = require('../../search/replica')
const getURL = require('./utils/getUrl')

const importReplica = async (req, res) => {
    const form = formidable({
        multiples: false
    })

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.json(getErrorData('Произошла ошибка'))
        } else {
            const errors = []
            const checkTokenResult = await checkToken(fields.token) || {}

            if (checkTokenResult.status === 'fail') {
                errors.push(checkTokenResult.errorText)
            }

            if (!fields.companyId) {
                errors.push('Компания не выбрана')
            }

            if (!fields.projectId) {
                errors.push('Проект не выбран')
            }

            if (errors.length) {
                return res.json(getErrorData(errors))
            } else {
                const buf = fs.readFileSync(files.fileXls.path);
                const workbook = XLSX.read(buf, {type:'buffer'});
                const sheet_name_list = workbook.SheetNames;
                const dataJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])

                if (dataJSON) {
                    for (const data of dataJSON) {
                        if (data['URL'] && data['Текст реплики']) {
                            const user = checkTokenResult.user
                            const category = (data['Категория'] ? (data['Категория'] === '1' ? '5f20587ad5378556248bff40' : '5f205882d5378556248bff41') : null)

                            const replica = new Replica({
                                createdBy: user._id.toString(),
                                createdDate: Date.now(),
                                deleted: false,
                                company: fields.companyId,
                                project: fields.projectId,
                                category: category,
                                status: statusesList.created,
                                date: Date.now(),
                                platform: getURL(data['URL']),
                                url: data['URL'],
                            })

                            const replicaNew = await replica.save()
                            const replicaId = replicaNew._id.toString()

                            if (replicaId) {
                                const replicaMsg = new ReplicaMsg({
                                    createdBy: user._id.toString(),
                                    createdDate: Date.now(),
                                    deleted: false,
                                    replica: replicaId,
                                    msg: data['Текст реплики'],
                                    comment: '',
                                })

                                await replicaMsg.save()
                                addSearchContentForReplica(replicaId)
                            }
                        }
                    }
                }

                res.json({
                    status: 'success',
                })
            }
        }
    })
}

module.exports = importReplica