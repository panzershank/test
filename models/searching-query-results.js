const { Schema, model } = require("mongoose");

const searchingQueryResultsSchema = new Schema({
    searchingQuery: {
        type: Schema.Types.ObjectId,
        ref: "SearchingQueries",
        required: true,
        default: null,
    },
    host: {
        type: String,
        required: true,
        default: null,
    },
    url: {
        type: String,
        required: true,
        default: null,
    },
    scale: {
        type: String,
        required: true,
        default: null,
    },
    rating: {
        type: String,
        required: true,
        default: null,
    },
    header: {
        type: String,
        required: true,
        default: null,
    },
    description: {
        type: String,
        required: true,
        default: null,
    },
    tonality: {
        type: String,
        required: true,
        default: null,
    },
}, {
    collection: "searching-query-results",
});

module.exports = model("SearchingQueryResults", searchingQueryResultsSchema);
