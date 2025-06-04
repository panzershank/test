const SearchingQueryResults = require("../../models/searching-query-results");
const { mongo} = require("mongoose");

const searchResult = async (req, res) => {
    try {
        req.body.data.forEach(async (item) => {
            const { _id, ...toUpdate } = item;

            await SearchingQueryResults.updateOne(
                { _id: mongo.ObjectId(_id) },
                {
                    $set: toUpdate,
                }
            )
        })
        

        res.status(200).json({
            status: "success",
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error,
        }); 
    }
};

module.exports = searchResult;
