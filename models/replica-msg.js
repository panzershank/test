const {Schema, model} = require('mongoose')

const replicaMsgSchema = new Schema({
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
    replica: {
        type: Schema.Types.ObjectId,
        ref: 'Replica',
        required: true,
        default: null,
    },
    msg: {
        type: String,
        required: false,
        default: null,
    },
    comment: {
        type: String,
        required: false,
        default: null,
    },
    status: {
        type: Schema.Types.ObjectId,
        ref: 'Statuses',
        required: false,
        default: null,
    },
    textSomeone: {
        type: String,
        required: false,
        default: null,
    },
}, {
    collection: 'replica-msg'
})

module.exports = model('ReplicaMsg', replicaMsgSchema)