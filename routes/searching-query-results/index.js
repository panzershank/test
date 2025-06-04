const { Router } = require("express");
const router = Router();

const fetchSearchingQueryResultsById = require("./fetch-searching-query-results-by-id");

router.get("/fetch-searching-query-results-by-id", fetchSearchingQueryResultsById);

module.exports = router;
