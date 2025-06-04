const {Schema, model} = require('mongoose')

const categoriesSchema = new Schema({
    name: {
        type: String,
        required: true,
        default: null,
    },
    sort: {
        type: Number,
        required: true,
        default: 500,
    },
}, {
    collection: 'categories'
})

module.exports = model('Categories', categoriesSchema)