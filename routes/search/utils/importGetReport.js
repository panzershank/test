/* ==========================================================================
   Получаем информацию по отчету из PixelTools
   ========================================================================== */

const axios = require("axios")

const importGetReport = async (reportId) => {
    if (reportId) {
        const response = await axios.get(`https://tools.pixelplus.ru/api/top10?key=b08fd106ab8a93d75ed40848c77582d1&report_id=${reportId}`)
        const data = response.data

        if (data && data.status === 'success') {
            return data
        }
    }

    return false
}

module.exports = importGetReport