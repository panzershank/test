const File = require('../../models/files')
const checkToken = require('../../utils/token')
const DesktopBlocks = require('../../models/desktopBlocks')
const getErrorData = require('../../utils/errors')
const fs = require('fs')
const config = require('../../config')
const Project = require('../../models/projects')
const Company = require('../../models/companies')
const { translit } = require('gost-transliteration')
const formidable = require('formidable')
const path = require('path');

const create = (file, i, compName, projName, dir, fileNameId) => {
	if (file) {
		const dirName = translit(dir[i]).replace(/[^a-zA-Zа-яА-Я0-9-_/ ]+/g, '').trim().replace(/[ ]+/g, '-').toLowerCase()
		file.name =
			translit(file.name)
				.replace(/[^a-zA-Zа-яА-Я0-9-_/. ]+/g, '')
				.trim()
				.replace(/[ ]+/g, '-')
				// .replace(/\.(?=[^.]*\.)/g, "_")
				.toLowerCase();


		fileNameId ? file.name = fileNameId : file.name =
			translit(file.name)
				.replace(/[^a-zA-Zа-яА-Я0-9-_/. ]+/g, '')
				.trim()
				.replace(/[ ]+/g, '-')
				// .replace(/\.(?=[^.]*\.)/g, "_")
				.toLowerCase();


		const filePath = path.join('./files', compName, projName, dirName);

		if (!fs.existsSync(filePath)) {
				fs.mkdirSync(filePath, { recursive: true });
		}

		const newFilePath = path.join(filePath, file.name);

		if (!fs.existsSync(newFilePath)) {
				fs.renameSync(file.path, newFilePath);
		} else {
				console.log('File already exists: ', newFilePath);
		}
	}
}

const createFile = async (req, res) => {
	const form = formidable({
		multiples: true
	})

	form.parse(req, async (err, fields, files) => {
		console.log(fields)
		if (err) {
			return res.json(getErrorData('Произошла ошибка'))
		} else {
			const errors = []
			const data = await checkToken(req.query.token) || {}

			if (data.status === 'fail') {
				errors.push(data.errorText)
			}

			if (errors.length) {
				return res.json(getErrorData(errors))
			} else {
				const proj = await Project.findById(req.query.project)
				const comp = await Company.findById(req.query.company)

				const compName = translit(comp.name).replace(/[^a-zA-Zа-яА-Я0-9-_ ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase()
				const projName = translit(proj.name).replace(/[^a-zA-Zа-яА-Я0-9-_ ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase()

				const dir = req.query.dirName.split(',')

				if (Array.isArray(files)) {
					files.forEach((file, i) => {
						create(file.file, i, compName, projName, dir, fields?.fileNameId);
					})
				} else if (files?.file) {
					create(files.file, 0, compName, projName, dir, fields?.fileNameId);
				}

				res.json({
					status: 'success',
				})
			}
		}
	})


}

module.exports = createFile
