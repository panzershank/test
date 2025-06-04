/* ==========================================================================
   Удалить кастомный блок
   ========================================================================== */

const Projects = require('../../models/projects')
const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')

const getSize = async (req, res) => {
	const errors = []
	const data = await checkToken(req.query.token) || {}
	
	if (data.status === 'fail') {
		errors.push(data.errorText)
	}
	
	if (!req.query.project) {
		errors.push('Проект не указан')
	} else {
		const projectCheck = await Projects.findById(req.query.project)
		
		if (!projectCheck) {
			errors.push('Проект не найден')
		}
	}
	
	if (errors.length) {
		return res.json(getErrorData(errors))
	} else {
		const proj = await Projects.findById(req.query.project)
		
		res.json({
			status: 'success',
			size: proj.size
		})
	}
}

module.exports = getSize