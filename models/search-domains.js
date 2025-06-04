const {Schema, model} = require('mongoose')

const searchDomainsSchema = new Schema({
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
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Projects',
        required: true,
        default: null,
    },
    name: {
        type: String,
        required: true,
        default: null,
    },
}, {
    collection: 'search-domains'
})

module.exports = model('SearchDomains', searchDomainsSchema)