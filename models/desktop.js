const {Schema, model} = require('mongoose')

const replicaSchema = new Schema({
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
}, {
    collection: 'desktop'
})

module.exports = model('Desktop', replicaSchema)