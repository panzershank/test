const {Schema, model} = require('mongoose')

const replicaFieldsSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        default: null,
    },
    createdDate: {
        type: Date,
        required: true,
        default: Date.now,
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
    field: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectsSettings',
        required: true,
        default: null,
    },
    value: {
        type: String,
        required: false,
        default: null,
    },
    valueOptions: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectsSettingsOptions',
        required: false,
        default: null,
    },
}, {
    collection: 'replica-fields'
})

module.exports = model('ReplicaFields', replicaFieldsSchema)