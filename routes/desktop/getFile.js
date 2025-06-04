/* ==========================================================================
   Удалить кастомный блок
   ========================================================================== */

const File = require('../../models/files')
const checkToken = require('../../utils/token')
const DesktopBlocks = require('../../models/desktopBlocks')
const getErrorData = require('../../utils/errors')
const getFile = async (req, res) => {
	const errors = []
	const data = await checkToken(req.query.token) || {}
	
	if (data.status === 'fail') {
		errors.push(data.errorText)
	}
	
	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const file = await File.findById(req.query.id)
		
		if (!File) {
			res.json({
				status: 'Error'
			})
		}
		
		res.json({
			status: 'Success',
			data: {
				path: file.path,
				name: file.name
			}
		})
	}
}

module.exports = getFile