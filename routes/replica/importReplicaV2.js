/* ==========================================================================
   Импорт данных v2
   ========================================================================== */

const fs = require('fs')
const XLSX = require('xlsx')
const formidable = require('formidable')
const nodemailer = require("nodemailer")
const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const Replica = require('../../models/replica')
const ReplicaMsg = require('../../models/replica-msg')
const ProjectsSettings = require('../../models/projects-settings')
const ReplicaFields = require('../../models/replica-fields')
const UsersInProject = require('../../models/users-in-project')
const statusesList = require('../../utils/statuses')
const addSearchContentForReplica = require('../../search/replica')
const getURL = require('./utils/getUrl')
const declOfNum = require("../../utils/declOfNum")
const config = require("../../config")
const emailReplicaAdd = require("../../emails/replicaAdd")
const addReplicaHistory = require("./utils/addReplicaHistory");
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes");
const addReplicaToPlan = require("../../utils/addReplicaToPlan");

const importReplicaV2 = async (req, res) => {
    const form = formidable({
        multiples: false
    })

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.json(getErrorData('Произошла ошибка'))
        } else {
           try {
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

                   const dataJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
                       header: 'A',
                   })

                   if (dataJSON) {
                       if (Object.keys(dataJSON[0]).length > 1) {
                           dataJSON.unshift({A: ""})
                       }

                       const user = checkTokenResult.user
                       const dataFinal = []

                       let type = null
                       let fieldNoteId = false

                       let errorAgent = false
                       let errorCategory = false
                       let errorText = false

                       // Определяем, есть в настройках проекта "Примечание" или нет
                       const projectsSettings = await ProjectsSettings.find({
                           deleted: false,
                           project: fields.projectId,
                       })
                           .select('project type sort name viewReplica')
                           .sort([['sort', 1]])

                       if (projectsSettings.length) {
                           for (const field of projectsSettings) {
                               if (field.type === 'note') {
                                   fieldNoteId = field._id.toString()
                               }
                           }
                       }

                       // Перебираем реплики на наличие ошибок + записываем все реплики в массив, который в дальнейшем будем разбирать и создавать данные
                       for (const i in dataJSON) {
                           const data = dataJSON[i] || {}

                           if (parseInt(i) === 0) {
                               const typeName = data.A

                               if (typeName) {
                                   type = (typeName.toLowerCase().trim() === 'инициирование' ? 1 : (typeName.toLowerCase().trim() === 'реагирование' ? 2 : null))
                               }
                           } else if (parseInt(i) > 1) {
                               const params = {
                                   type: type,
                                   parentId: null,
                                   category: null,
                                   main: false,
                               }

                               if (type && type === 1) {
                                   params.main = data.A
                                   params.url = data.B
                                   params.text = data.C
                                   params.agentName = data.D
                                   params.note = data.E
                               } else if (type && type === 2) {
                                   params.main = data.A
                                   params.url = data.B
                                   params.category = data.C
                                   params.text = data.D
                                   params.agentName = data.E
                                   params.note = data.F
                               } else {
                                   params.url = data.A
                                   params.category = data.B
                                   params.text = data.C
                                   params.agentName = data.D
                                   params.note = data.E
                                   params.textSomeone = data.F
                               }

                               if (type && (type === 1 || type === 2)) {
                                   if (params.main) {
                                       params.main = (params.main.toLowerCase().trim() === 'да')
                                   } else {
                                       params.main = false
                                   }
                               }

                               if (params.category) {
                                   if (params.category.toLowerCase().trim() === 'официальный представитель') {
                                       params.category = '5f20587ad5378556248bff40'
                                   } else if (params.category.toLowerCase().trim() === 'агент влияния') {
                                       params.category = '5f205882d5378556248bff41'
                                   } else {
                                       params.category = '5f20587ad5378556248bff40'
                                   }
                               }

                               if (!params.agentName) {
                                   errorAgent = true
                               }

                               if (params.type !== 1 && !params.category) {
                                   errorCategory = true
                               }

                               if (!params.text) {
                                   errorText = true
                               }

                               dataFinal.push(params)
                           }
                       }

                       if (errorAgent) {
                           errors.push('Укажите имя агента у всех реплик, это обязательное поле')
                       }

                       if (errorCategory) {
                           errors.push('Укажите категорию у всех реплик, это обязательное поле')
                       }

                       if (errorText) {
                           errors.push('Укажите текст реплики у всех реплик, это обязательное поле')
                       }

                       if (errorAgent) {
                           return res.json(getErrorData(errors))
                       } else {
                           let parentId = false
                           let i = 0
                           const date = Date.now()
                           for (const data of dataFinal) {
                               const replica = new Replica({
                                   createdBy: user._id.toString(),
                                   createdDate: date - i,
                                   deleted: false,
                                   company: fields.companyId,
                                   project: fields.projectId,
                                   category: data.category,
                                   status: ((data.type && data.type === 2 && data.main) ? statusesList.posted : statusesList.waiting),
                                   date: date - i,
                                   platform: getURL(data.url),
                                   url: data.url,
                                   parentId: (parentId && !data.main ? parentId : null),
                                   type: (data.type ? data.type : null),
                                   agentName: (data.agentName ? data.agentName : null),
                                   statusChange: date - i,
                               }) || {}

                               const replicaNew = await replica.save() || {}
                               const replicaId = replicaNew._id.toString()

                               if (replicaId) {
                                   if (data.type && (data.type === 1 || data.type === 2) && data.main) {
                                       parentId = replicaId
                                   }

                                   const replicaMsg = new ReplicaMsg({
                                       createdBy: user._id.toString(),
                                       createdDate: date - i,
                                       deleted: false,
                                       replica: replicaId,
                                       msg: data.text,
                                       textSomeone: (data.textSomeone ? data.textSomeone : null),
                                       comment: '',
                                   }) || {}

                                   await replicaMsg.save()
                                   addSearchContentForReplica(replicaId)

                                   if (fieldNoteId && data.note) {
                                       const replicaFields = new ReplicaFields({
                                           createdBy: user._id.toString(),
                                           createdDate: date - i,
                                           deleted: false,
                                           replica: replicaId,
                                           field: fieldNoteId,
                                           value: data.note,
                                           valueOptions: null,
                                       }) || {}

                                       await replicaFields.save()
                                   }

                                   await addReplicaHistory({
                                       id: replicaId.toString(),
                                       userId: user._id.toString(),
                                       msg: (data.text ? data.text : ''),
                                       msgOld: '',
                                       status: false,
                                       type: replicaHistoryTypes.create,
                                   })

                                   await addReplicaToPlan(user, replicaId)
                               }

                               i++
                           }

                           // Отправляем письмо
                           if (dataFinal.length > 1) {
                               const transport = nodemailer.createTransport(config.SMTP_SETTINGS)

                               const usersInProject = await UsersInProject.find({
                                   projectId: fields.projectId,
                                   deleted: false,
                                   active: true
                               })
                                   .select('userId projectId')
                                   .populate({
                                       path: 'userId',
                                       select: '_id name lastName email role notifyReplicaAdd',
                                       populate: {
                                           path: 'role',
                                           select: '_id name accessLevel',
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

                               if (usersInProject) {
                                   for (const usersInProjectData of usersInProject) {
                                       if (usersInProjectData.userId
                                        && !usersInProjectData.userId.deleted
                                        && usersInProjectData.userId.role.accessLevel === 2
                                        && usersInProjectData.userId.notifyReplicaAdd) {
                                           const emailOptions = {
                                               email: usersInProjectData.userId.email,
                                               company: usersInProjectData.projectId.companyId.name,
                                               project: usersInProjectData.projectId.name,
                                               text: `Добавлено ${dataFinal.length} ${declOfNum(dataFinal.length, ['реплика', 'реплики', 'реплик'])}`,
                                           }

                                           await transport.sendMail(emailReplicaAdd(emailOptions))
                                       }
                                   }
                               }
                           }
                       }
                   }

                   res.json({
                       status: 'success',
                   })
               }
           } catch (error) {
               console.error(`[error] /import-v2 ошибка: ${error?.message || error.toString()  || 'unknown error'}`)
               res.status(422).json({
                   status: 'fail',
                   errorText: error?.message || error.toString() || 'unknown error',
               })
           }
        }
    })
}

module.exports = importReplicaV2
