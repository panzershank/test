const checkToken = require("../../../utils/token")
const service = require("./replica.service")

const replica = async (request, response) => {
    console.log(`[findReplica] query: ${JSON.stringify(request.query)}`)
    try {
        const decode = await checkToken(request.query.token)
        const user = decode.user

        if (!user) {
            return response.status(400).send({
                status: 'fail',
                errorText: decode?.errorText ?? 'Error valid token',
            })
        }

        const q = request.query['f-search']
        // Если пользователь не админ, выбираем связи проектов с пользователями, в противном случае выбираем все реплики
        const view = request.query.view ? +request.query.view : 20;
        const page =  request.query.page ? +request.query.page : 1;
        const type = request.query['type'] !== "null" ? +request.query['type'] : null;
        const project = request.query['f-project'];
        const status = request.query['f-status']
        const dateTo = request.query['f-dateTo'] ? request.query['f-dateTo'] : null
        const dateFrom = request.query['f-dateFrom'] ? request.query['f-dateFrom'] : null
        const company = request.query['f-company'];
        const platform = request.query['f-platform']
        const category = request.query['f-category']
        const parentId = request.query.parentId ? request.query.parentId : null;
        const sortName = request.query.sortName ? request.query.sortName : 'date'
        const pageStart = request.query.pageStart;
        const statusChange = request.query['f-status-change'] ? request.query['f-status-change'] : null
        const sortDirection = request?.query?.sortDirection === 'asc' ? 1 : -1

        const params = { q, view, page, type, project, status, dateTo, dateFrom, company, sortName, platform, category, parentId, pageStart, statusChange, sortDirection, user, userId: String(user._id)}

        const result = await service.findReplica(params);

        response.status(200).json(result)
    } catch (error) {
        console.error(`[replica.controller] error: ${error?.message || error.toString() || 'Unknown error'}`)
    }
};


module.exports = {replica}
