const Users = require('../models/users')
const Tokens = require('../models/tokens')

const checkToken = async (token) => {
    const errors = []

    if (!token) {
        errors.push('Токен не указан')
    } else {
        const tokenData = await Tokens.findOne({
            token
        })

        if (!tokenData) {
            errors.push('Токен недействителен, получите новый токен')
        } else {
            if (new Date() > tokenData.tokenExp) {
                errors.push('Токен недействителен, получите новый токен')
            } else {
                const user = await Users.findOne({
                    _id: tokenData.createdBy,
                    deleted: false
                }).populate('role', 'name accessLevel')

                if (!user) {
                    errors.push('Токен недействителен, получите новый токен')
                } else {
                    return {
                        status: 'success',
                        user
                    }
                }
            }
        }
    }

    if (errors.length) {
        return {
            status: 'fail',
            errorText: errors.join(', ')
        }
    }
}

module.exports = checkToken