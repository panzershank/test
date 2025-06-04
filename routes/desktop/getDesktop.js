/* ==========================================================================
   Выбираем всю информацию по странице "Рабочий стол"
   ========================================================================== */

const checkToken = require('../../utils/token')
const getErrorData = require('../../utils/errors')
const getCompanies = require("./utils/getCompanies")
const getProjects = require("./utils/getProjects")
const getDesktopData = require("./utils/getDesktopData")
const Project = require("../../models/projects")

const getDesktop = async (req, res) => {
    const errors = []
    const data = await checkToken(req.query.token) || {}

    if (data.status === 'fail') {
        errors.push(data.errorText)
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = data.user
        const companies = await getCompanies(user._id) || []
        const autoSelect = (req.query.autoSelect && req.query.autoSelect === "Y")

        let companyId = (req.query.company ? req.query.company : false)
        let projectId = (req.query.project ? req.query.project : false)

        const returnSuccess = {
            status: 'success',
            companies: companies,
            projects: [],
            blocksSystem: [],
            blocksCustom: [],
            blocksBackup: {},
            companyActive: false,
            projectActive: false,
            desktopId: false,
            size: 0
        }

        if (companies.length) {
            if (autoSelect) {
                if (!companyId) {
                    for (const company of companies) {
                        if (companyId && projectId) {
                            break
                        }

                        companyId = company._id.toString()
                        const projects = await getProjects(user._id, companyId) || []

                        if (projects.length) {
                            projectId = projects[0]._id.toString()
                        }
                    }
                } else if (companyId && !projectId) {
                    const projects = await getProjects(user._id, companyId) || []

                    if (projects.length) {
                        projectId = projects[0]._id.toString()
                        returnSuccess.size = projects[0].size
                    }
                }
            }

            if (companyId) {
                returnSuccess.companyActive = companyId
                returnSuccess.projects = await getProjects(user._id, companyId) || []
            }

            if (projectId) {
                returnSuccess.projectActive = projectId
                const project = Project.findById(projectId)
                returnSuccess.size = project.size

                const desktopInfo = await getDesktopData(projectId) || []
                
                if (desktopInfo.id) {
                    returnSuccess.desktopId = desktopInfo.id
                }

                if (desktopInfo.blocks.length) {
                    for (const block of desktopInfo.blocks) {
                        if (block.type === 4) {
                            returnSuccess.blocksCustom.push(block)
                        } else {
                            returnSuccess.blocksSystem.push(block)
                        }

                        returnSuccess.blocksBackup[block._id] = block
                    }
                }
            }
        }
        
        res.json(returnSuccess)
    }
}

module.exports = getDesktop