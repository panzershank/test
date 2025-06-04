const getErrorData = (error = '') => {
    let text = error

    if (Array.isArray(error)) {
        text = error.join(', ')
    }

    return {
        status: 'fail',
        errorText: text,
    }
}

module.exports = getErrorData