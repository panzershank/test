const {Schema, model} = require('mongoose')

const searchTasksSchema = new Schema({
    createdDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    modifiedDate: {
        type: Date,
        required: false,
        default: null,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Projects',
        required: true,
        default: null,
    },
    queries: {
        type: Array,
        required: true,
        default: null,
    },
    searchSystem: {
        type: String,
        required: true,
        default: null,
    },
    status: {
        type: String,
        required: true,
        default: null,
    },
    reportId: {
        type: String,
        required: false,
        default: null,
    },
}, {
    collection: 'search-tasks'
})

module.exports = model('SearchTasks', searchTasksSchema)