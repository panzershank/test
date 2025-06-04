const {Schema, model} = require('mongoose')

const tokenSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        default: null,
    },
    createdDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    token: {
        type: String,
        required: true,
        default: null,
    },
    tokenExp: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, {
    collection: 'tokens'
})

module.exports = model('Tokens', tokenSchema)