/* ==========================================================================
   Выбираем блоки рабочего стола проекта
   ========================================================================== */

const File = require('../../../models/files')

const getFileDataToReturn = async (fileId) => {
	const returnData = {
		name: '',
		size: '',
		type: '',
		url: '',
		_id: ''
	}
	
	if (fileId) {
		const file = await File.findById(fileId) || {}
		
		if (file) {
			returnData.name = file.name
			returnData.size = file.size
			returnData.type = file.type
			returnData.url = file.path
			returnData._id = file._id
		}
	}
	
	return returnData
}

module.exports = getFileDataToReturn
