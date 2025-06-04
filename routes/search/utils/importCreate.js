/* ==========================================================================
   Отправляем данные в PixelTools для начала сбора данных
   ========================================================================== */

const axios = require("axios")
const qs = require("qs")

const importCreate = async (props) => {
    if (props.queries && props.queries.length > 0 && props.ss) {
        const response = await axios({
            method: 'POST',
            url: 'https://tools.pixelplus.ru/api/top10?key=b08fd106ab8a93d75ed40848c77582d1',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: qs.stringify({
                queries: props.queries.join("\n"),
                deep: '20',
                ss: props.ss,
                lr: '213',
            })
        })

        const data = response.data

        if (data && data.report_id) {
            return data.report_id
        }
    }

    return false
}

module.exports = importCreate