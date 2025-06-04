const fs = require('fs').promises;
const File = require('../../models/files');
const Project = require('../../models/projects');
const checkToken = require('../../utils/token');
const getErrorData = require('../../utils/errors');
const DesktopBlocks = require('../../models/desktopBlocks')
const { mongo } = require("mongoose");


const removeFile = async (req, res) => {
  const errors = [];
  const data = await checkToken(req.query.token) || {};
	if (data.status === 'fail') {
		errors.push(data.errorText);
	}

	if (errors.length) {
			return res.json(getErrorData(errors));
	} else {
		try {
			const file = await File.findById(req.query.id);

			try {
				if (req.query?.path) {
					await fs.unlink(req.query?.path);
				}
			} catch (err) {
				console.log('File not found on server, but proceeding to delete from DB');
			}

			await File.findByIdAndDelete(req.query.id);
			await DesktopBlocks.updateOne({ _id: req.query.blockId }, { $pull: { documents: { file: mongo.ObjectId(req.query.id) } } });

			res.json({
				status: 'Success',
				message: 'File successfully deleted',
				data: {
					path: file?.path,
					name: file?.name
				}
			});
		} catch (error) {
			if (!req.query.id || !req.query.path) {
				await DesktopBlocks.updateOne({ _id: req.query.blockId }, { $set: { documents: [] } });
			}

			res.json({
				status: 'Error',
				message: 'An error occurred while deleting the file',
				error: error.message
			});
		}
	}
}

module.exports = removeFile;
