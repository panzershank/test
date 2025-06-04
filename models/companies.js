const {Schema, model} = require('mongoose')

const companiesSchema = new Schema({
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
}, {
    collection: 'companies'
})

module.exports = model('Companies', companiesSchema)