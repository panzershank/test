const Users = require("../models/users")
const UsersInProject = require("../models/users-in-project")

module.exports = async function(userId) {
    if (userId) {
        const user = await Users.findOne({_id: userId})

        if (user) {
            let userActive = false

            const usersInProject = await UsersInProject.find({
                deleted: false,
                active: true,
                userId: user._id.toString(),
            }).populate('projectId', 'active deleted')

            if (usersInProject) {
                for (const data of usersInProject) {
                    if (data.projectId.active) {
                        userActive = true
                        break
                    }
                }
            }

            user.active = userActive
            await user.save()
        }
    } else {
        const users = await Users.find({
            deleted: false
        })

        if (users) {
            for (const usersData of users) {
                const user = await Users.findOne({_id: usersData._id})

                if (user) {
                    let userActive = false

                    const usersInProject = await UsersInProject.find({
                        deleted: false,
                        active: true,
                        userId: user._id.toString(),
                    }).populate('projectId', 'active deleted')

                    if (usersInProject) {
                        for (const data of usersInProject) {
                            if (data.projectId.active) {
                                userActive = true
                                break
                            }
                        }
                    }

                    user.active = userActive
                    await user.save()
                }
            }
        }
    }
}