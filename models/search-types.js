const {Schema, model} = require('mongoose')

const searchTypesSchema = new Schema({
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
    sort: {
        type: Number,
        required: true,
        default: 500,
    },
}, {
    collection: 'search-types'
})

module.exports = model('SearchTypes', searchTypesSchema)