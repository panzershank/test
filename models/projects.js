const {Schema, model} = require('mongoose')

const projectsSchema = new Schema({
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
    active: {
        type: Boolean,
        required: true,
        default: true,
    },
    deleted: {
        type: Boolean,
        required: true,
        default: false,
    },
    name: {
        type: String,
        required: true,
        default: null,
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Companies',
        required: true,
        default: null,
    },
    search: {
        type: String,
        required: false,
        default: null,
    },
    deleteMsg: {
        type: String,
        required: false,
        default: null,
    },
    changes: {
        type: Boolean,
        required: false,
        default: false,
    },
    analysisFrequencyHide: {
        type: Boolean,
        required: false,
        default: false,
    },
    file: {
        type: Schema.Types.ObjectId,
        ref: 'File'
    },
    size: {
        type: String,
        required: false,
        default: '50000000'
    }
}, {
    collection: 'projects'
})

module.exports = model('Projects', projectsSchema)