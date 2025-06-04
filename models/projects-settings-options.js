const {Schema, model} = require('mongoose')

const projectsSettingsOptionsSchema = new Schema({
    field: {
        type: Schema.Types.ObjectId,
        ref: 'ProjectsSettings',
        required: true,
        default: null,
    },
    value: {
        type: String,
        required: true,
        default: null,
    },
    deleted: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    collection: 'projects-settings-options'
})

module.exports = model('ProjectsSettingsOptions', projectsSettingsOptionsSchema)