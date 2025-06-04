const {Schema, model} = require('mongoose')

const searchCommentsSchema = new Schema({
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
    domain: {
        type: Schema.Types.ObjectId,
        ref: 'SearchDomains',
        required: true,
        default: null,
    },
    text: {
        type: String,
        required: true,
        default: null,
    },
}, {
    collection: 'search-comments'
})

module.exports = model('SearchComments', searchCommentsSchema)