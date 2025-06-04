/* ==========================================================================
   Импорт данных
   ========================================================================== */

const checkToken = require("../../utils/token")
const getErrorData = require("../../utils/errors")
const formidable = require("formidable")
const fs = require("fs")
const XLSX = require("xlsx")

const importData = async (req, res) => {
	const form = formidable({
		multiples: false
	})

	form.parse(req, async (err, fields, files) => {
		if (err) {
			return res.json(getErrorData('Произошла ошибка'))
		} else {
			const errors = []
			const checkTokenResult = await checkToken(fields.token) || {}
			let dataJSON = false

			if (checkTokenResult.status === 'fail') {
				errors.push(checkTokenResult.errorText)
			}

			if (!files.file) {
				errors.push('Файл не выбран')
			} else {
				const fileName = files.file.name.toLowerCase()

				if (fileName.indexOf(".xls") === -1) {
					errors.push('Выберите XLS файл')
				} else {
					const buf = fs.readFileSync(files.file.path)
					const workbook = XLSX.read(buf, {type: 'buffer', cellText: false, cellDates: true})
					const sheetNameList = workbook.SheetNames

					dataJSON = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]], {
						header: 'A',
						raw: false,
						dateNF: 'dd"."mm"."yyyy',
					})

					if (!dataJSON) {
						errors.push('Файл не может быть открыт')
					}
				}
			}

			if (errors.length) {
				return res.json(getErrorData(errors))
			} else {
				const dataBefore = {}
				const data = []

				let number = 0
				let numberBlock = 0

				for (const row of dataJSON) {
					if (!row.A || (row.A && row.A.toLowerCase().trim() !== 'информация')) {
						if (row.A) {
							if (!number) {
								numberBlock += 1
							}

							if (!dataBefore[numberBlock]) {
								dataBefore[numberBlock] = {}
							}

							if (!number) {
								dataBefore[numberBlock].date = row.A.trim()
							} else if (number === 1) {
								dataBefore[numberBlock].searchQuery = row.A.trim()
							} else if (number === 2) {
								dataBefore[numberBlock].searchSystem = row.A.trim()
							} else if (number === 3) {
								dataBefore[numberBlock].type = row.A.toUpperCase().trim()
							} else if (number === 4) {
								dataBefore[numberBlock].region = row.A.trim()
							} else if (number === 5) {
								dataBefore[numberBlock].frequency = parseInt(row.A.trim())
							}

							number++
						} else {
							number = 0
						}

						if (!dataBefore[numberBlock].data) {
							dataBefore[numberBlock].data = []
						}

						dataBefore[numberBlock].data.push({
							position: (row.B ? parseInt(row.B.trim()) : ''),
							url: (row.C ? row.C.trim() : ''),
							title: (row.D ? row.D.trim() : ''),
							description: (row.E ? row.E.trim() : ''),
							rating: (row.F ? parseFloat(row.F.trim()).toFixed(2) : ''),
						})
					}
				}

				if (dataBefore && Object.keys(dataBefore).length) {
					for (const number of Object.keys(dataBefore)) {
						const count = (dataBefore[number].data && dataBefore[number].data.length ? dataBefore[number].data.length : 0)

						if (count === 10 || count === 20 || count === 30) {
							data.push(dataBefore[number])
						}
					}
				}

				res.json({
					status: 'success',
					data: data,
				})
			}
		}
	})
}

module.exports = importData