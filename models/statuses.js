const {Schema, model} = require('mongoose')

const statusSchema = new Schema({
    name: {
        type: String,
        required: true,
        default: null,
    },
    code: {
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
    collection: 'statuses'
})

module.exports = model('Statuses', statusSchema)