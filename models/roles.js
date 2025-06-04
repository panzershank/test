const {Schema, model} = require('mongoose')

const roleSchema = new Schema({
    name: {
        type: String,
        required: true,
        default: null,
    },
    accessLevel: {
        type: Number,
        required: true,
        default: 2,
    },
    sort: {
        type: Number,
        required: true,
        default: 500,
    },
}, {
    collection: 'roles'
})

module.exports = model('Roles', roleSchema)