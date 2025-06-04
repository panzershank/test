/* ==========================================================================
   Создаем рабочий стол и привязываем его к компании и проекту
   Также создаем стандартную стркутуру блоков
   ========================================================================== */

const Desktop = require('../../../models/desktop')
const DesktopBlocks = require('../../../models/desktopBlocks')
const Projects = require('../../../models/projects')

const createDesktop = async (projectId) => {
    if (projectId) {
        const project = await Projects.findOne({
            _id: projectId.toString(),
            deleted: false
        }) || {}

        if (project && project.companyId) {
            const desktop = new Desktop({
                company: project.companyId._id.toString(),
                project: project._id.toString(),
            }) || {}

            if (desktop) {
                await desktop.save()
                const desktopId = desktop._id.toString()

                // Добавляем системный блок 1
                const desktopBlock1 = new DesktopBlocks({
                    desktop: desktopId,
                    name: 'Документы',
                    type: 1,
                    sort: 100,
                    documents: [],
                }) || {}

                await desktopBlock1.save()

                // Добавляем системный блок 2
                const desktopBlock2 = new DesktopBlocks({
                    desktop: desktopId,
                    name: 'KPI',
                    type: 2,
                    sort: 200,
                }) || {}

                await desktopBlock2.save()

                // Добавляем системный блок 3
                const desktopBlock3 = new DesktopBlocks({
                    desktop: desktopId,
                    name: 'Бюджет',
                    type: 3,
                    sort: 300,
                }) || {}

                await desktopBlock3.save()

                return desktop
            }
        }
    }

    return false
}

module.exports = createDesktop