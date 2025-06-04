const { Schema, model } = require('mongoose');

const searchingQueriesSchema = new Schema({
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
    isResults: {
        type: Boolean,
        required: true,
        default: false,
    },
    taskId: {
        type: Number,
        required: false,
        default: null,
    },
    toolName: {
        type: String,
        required: true,
        default: null,
    },
    brandName: {
        type: String,
        required: true,
        default: null,
    },
    regionId: {
        type: Number,
        required: true,
        default: null,
    },
    regionName: {
        type: String,
        required: true,
        default: null,
    },
    deep: {
        type: Number,
        required: true,
        default: null,
    },
    findSystem: {
        type: Number,
        required: true,
        default: null,
    },
    findSystemName: {
        type: String,
        required: true,
        default: null,
    },
}, {
    collection: "searching-queries",
});

module.exports = model("SearchingQueries", searchingQueriesSchema);
