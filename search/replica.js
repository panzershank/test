const Replica = require("../models/replica")
const ReplicaMsg = require("../models/replica-msg")

module.exports = async function(replicaId) {
    if (replicaId) {
        const replica = await Replica.findOne({
            _id: replicaId,
            deleted: false,
        })

        const replicaMsg = await ReplicaMsg.find({
            replica: replicaId,
            deleted: false,
        })

        if (replica && replicaMsg) {
            const arrMsg = []

            if (replica.url) {
                arrMsg.push(replica.url.toLowerCase())
            }

            for (const replicaMsgData of replicaMsg) {
                if (replicaMsgData.msg) {
                    arrMsg.push(replicaMsgData.msg.toLowerCase())
                }

                if (replicaMsgData.comment) {
                    arrMsg.push(replicaMsgData.comment.toLowerCase())
                }
            }

            if (arrMsg.length) {
                replica.search = arrMsg.join(' ')
            } else {
                replica.search = ''
            }

            await replica.save()
        }
    }
}