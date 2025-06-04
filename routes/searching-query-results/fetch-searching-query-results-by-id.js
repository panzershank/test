const SearchingQueryResults = require('../../models/searching-query-results');

const fetchSearchingQueryResultsById = async (req, res) => {
    try {
        const { searchingQueryId } = req.query;

        const searchingQueryResults = await SearchingQueryResults
            .find({ searchingQuery: searchingQueryId.toString() })
            .populate("searchingQuery", "brandName _id");

        res.status(200).json({
            status: 'success',
            data: searchingQueryResults,
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error,
        });
    }
}

module.exports = fetchSearchingQueryResultsById;
