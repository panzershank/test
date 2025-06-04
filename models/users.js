const {Schema, model} = require('mongoose')

const userSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        default: null,
    },
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
        default: false,
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
    lastName: {
        type: String,
        required: true,
        default: null,
    },
    email: {
        type: String,
        required: true,
        default: null,
    },
    password: {
        type: String,
        required: true,
        default: null,
    },
    companyId: {
        type: Schema.Types.ObjectId,
        ref: 'Companies',
        required: false,
        default: null,
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Roles',
        required: true,
        default: null,
    },
    search: {
        type: String,
        required: false,
        default: null,
    },
    onlyView: {
        type: Boolean,
        required: false,
        default: false,
    },
    notifyReplicaAdd: {
        type: Boolean,
        required: true,
        default: true,
    },
    notifyReplicaDelete: {
        type: Boolean,
        required: true,
        default: true,
    },
    notifyReplicaStatusChange: {
        type: Boolean,
        required: true,
        default: true,
    },
    telegramChat: {
        type: String,
        required: false,
        default: null,
    },
}, {
    collection: 'users'
})

module.exports = model('Users', userSchema)
