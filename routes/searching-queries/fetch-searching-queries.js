const SearchingQueries = require("../../models/searching-queries");

const fetchSearchingQueries = async (req, res) => {
    try {
        const { page, limit, userId, brandName, regionName, findSystem, deep } = req.query;

        const filters = {
            createdBy: userId,
            ...(brandName && {
                brandName: {
                    "$regex": brandName,
                    "$options": "i",
                },
            }),
            ...(regionName && {
                regionName: {
                    "$regex": regionName,
                    "$options": "i",
                },
            }),
            ...(findSystem && {
                findSystem: Number(findSystem),
            }),
            ...(deep && {
                deep: Number(deep),
            }),
        };

        const searchingQueries =
            await SearchingQueries
                .find(filters)
                .populate("createdBy", "email _id name lastName")
                .limit(+limit)
                .skip((+page - 1) * limit)
                .sort({ createdDate: -1 });

        const count = await SearchingQueries.countDocuments(filters);

        res.status(200).json({
            status: "success",
            data: {
                searchingQueries,
                totalPages: Math.ceil(count / +limit),
                currentPage: +page,
                totalQueries: count,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "error",
            message: error,
        });
    }
};

module.exports = fetchSearchingQueries;
