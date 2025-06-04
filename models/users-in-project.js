const {Schema, model} = require('mongoose')

const usersInProjectSchema = new Schema({
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
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Projects',
        required: true,
        default: null,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        default: null,
    },
    deleteMsg: {
        type: String,
        required: false,
        default: null,
    },
}, {
    collection: 'users-in-project'
})

module.exports = model('UsersInProject', usersInProjectSchema)