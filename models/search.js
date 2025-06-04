const {Schema, model} = require('mongoose')

const searchSchema = new Schema({
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
    searchQuery: {
        type: String,
        required: true,
        default: null,
    },
    searchSystem: {
        type: String,
        required: true,
        default: null,
    },
    tonality: {
        type: String,
        required: false,
        default: null,
    },
    type: {
        type: Schema.Types.ObjectId,
        ref: 'SearchTypes',
        required: false,
        default: null,
    },
    url: {
        type: String,
        required: true,
        default: null,
    },
    domain: {
        type: String,
        required: true,
        default: null,
    },
    title: {
        type: String,
        required: false,
        default: null,
    },
    description: {
        type: String,
        required: false,
        default: null,
    },
    position: {
        type: Number,
        required: true,
        default: null,
    },
}, {
    collection: 'search'
})

module.exports = model('Search', searchSchema)