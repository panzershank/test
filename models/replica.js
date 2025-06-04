const {Schema, model} = require('mongoose')

const replicaSchema = new Schema({
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
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Companies',
        required: true,
        default: null,
    },
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Projects',
        required: true,
        default: null,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Categories',
        required: false,
        default: null,
    },
    status: {
        type: Schema.Types.ObjectId,
        ref: 'Statuses',
        required: true,
        default: null,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    platform: {
        type: String,
        required: false,
        default: null,
    },
    url: {
        type: String,
        required: false,
        default: null,
    },
    screenshot: {
        type: String,
        required: false,
        default: null,
    },
    agentName: {
        type: String,
        required: false,
        default: null,
    },
    search: {
        type: String,
        required: false,
        default: null,
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Replica',
        required: false,
        default: null,
    },
    type: {
        type: Number,
        required: false,
        default: null,
    },
    statusChange: {
        type: Date,
        required: false,
        default: null,
    },
    noteSystem: {
        type: String,
        required: false,
        default: null,
    },
}, {
    collection: 'replica'
})

module.exports = model('Replica', replicaSchema)