/* ==========================================================================
   Получаем название площадки из URL
   ========================================================================== */

const getURL = url => {
    if (url) {
        url = url.split('https://').join('')
        url = url.split('http://').join('')
        url = url.split('www.').join('')
        url = url.split('/')
        url = url[0]

        return url
    } else {
        return ''
    }
}

module.exports = getURL