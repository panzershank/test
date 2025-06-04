/* ==========================================================================
   Пользовательский скрипт для разных операций
   ========================================================================== */

const Replica = require("../../models/replica")
const addSearchContentForReplica = require('../../search/replica')

const userScripts = async (req, res) => {
    const replica = await Replica.find({
        deleted: false,
    }) || []

    if (replica.length) {
        for (const data of replica) {
            if (data._id) {
                addSearchContentForReplica(data._id.toString())
            }
        }
    }

    res.json({
        status: 'success',
    })
}

module.exports = userScripts