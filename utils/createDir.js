const Project = require('../models/projects')
const Company = require('../models/companies')
const File = require('../models/files')
const { translit } = require('gost-transliteration')
const path = require('path');


const createDir = async (file, project, company) => {
	const proj = await Project.findById(project)
	const comp = await Company.findById(company)

	const compName = translit(comp.name).replace(/[^a-zA-Zа-яА-Я0-9-_ ]+/g, '').trim().replace(/[ ]+/g, '-').toLowerCase()
	const projName = translit(proj.name).replace(/[^a-zA-Zа-яА-Я0-9-_ ]+/g, '').trim().replace(/[ ]+/g, '-').toLowerCase()
	const fileName = translit(file.name).replace(/[^a-zA-Zа-яА-Я0-9-_/. ]+/g, '').trim().replace(/[ ]+/g, '-').toLowerCase()
	const filePath = path.join('./files', compName, projName, file.path);

	const createdFile = await new File({
		name: fileName,
		type: file.type,
		size: file.size,
		path: filePath,
		project: project,
		company: company,
	}) || {}

	await createdFile.save()

	return createdFile
}

module.exports = createDir
