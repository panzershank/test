const {Schema, model} = require('mongoose')

const replicaSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: false,
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
    desktop: {
        type: Schema.Types.ObjectId,
        ref: 'Desktop',
        required: true,
        default: null,
    },
    name: {
        type: String,
        required: false,
        default: null,
    },
    description: {
        type: String,
        required: false,
        default: null,
    },
    url: {
        type: String,
        required: false,
        default: null,
    },
    iconPath: {
        type: String,
        required: false,
        default: null,
    },
    documents: {
        type: Array,
        required: false,
        default: [],
    },
    type: {
        type: Number,
        required: true,
        default: 3,
    },
    sort: {
        type: Number,
        required: true,
        default: 500,
    },
    uuidPath: {
      type: String,
      required: false,
      default: null,
    },
}, {
    collection: 'desktopBlocks'
})

module.exports = model('DesktopBlocks', replicaSchema)
