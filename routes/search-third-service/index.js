/* ==========================================================================
   Поисковый запрос ARSENKIN
   ========================================================================== */

const { Router } = require('express');
const router = Router();

const createTaskId = require("./createTaskId");
const checkTaskId = require("./checkTaskId");
const searchResult = require("./searchResult");
const updateResults = require("./updateResults");

router.post("/create-task-id", createTaskId);
router.get("/check-task-id", checkTaskId);
router.get("/search-result", searchResult);
router.put("/update-results", updateResults);

module.exports = router;
