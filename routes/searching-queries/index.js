const { Router } = require("express");
const router = Router();

const fetchSearchingQueries = require("./fetch-searching-queries");

router.get("/fetch-searching-queries", fetchSearchingQueries);

module.exports = router;
