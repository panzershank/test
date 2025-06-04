/* ==========================================================================
   Выбираем типы площадок
   ========================================================================== */

const SearchTypes = require("../../../models/search-types")

const getTypes = async () => {
    const arrTypes = []

    const types = await SearchTypes.find({
        deleted: false,
    }).sort([['sort', 1]])

    if (types) {
        for (const item of types) {
            arrTypes.push(item)
        }
    }

    return (arrTypes.length ? arrTypes.map(item => ({
        id: item._id.toString(),
        name: item.name,
    })) : [])
}

module.exports = getTypes