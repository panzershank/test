const {Schema, model} = require('mongoose')

const projectsSettingsSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        default: null,
    },
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: false,
        default: null,
    },
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
    deleted: {
        type: Boolean,
        required: true,
        default: false,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Projects',
        required: true,
        default: null,
    },
    type: {
        type: String,
        required: true,
        default: null,
    },
    sort: {
        type: Number,
        required: true,
        default: 500,
    },
    name: {
        type: String,
        required: false,
        default: null,
    },
    viewReplica: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    collection: 'projects-settings'
})

module.exports = model('ProjectsSettings', projectsSettingsSchema)