const Users = require("../models/users")

module.exports = async function(userId) {
    if (userId) {
        const user = await Users.findOne({
            _id: userId,
            deleted: false,
        })

        if (user) {
            const arrSearch = []

            if (user.name) {
                arrSearch.push(user.name.toLowerCase())
            }

            if (user.lastName) {
                arrSearch.push(user.lastName.toLowerCase())
            }

            if (user.email) {
                arrSearch.push(user.email.toLowerCase())
            }

            if (arrSearch.length) {
                user.search = arrSearch.join(' ')
            } else {
                user.search = ''
            }

            await user.save()
        }
    }
}