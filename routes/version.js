const package = require('../package.json')
const {Router} = require('express')
const router = Router()

router.get('/', async (req, res) => {

    res.status(200).json({
        status: 'success',
        version: package.version,
    })

})

module.exports = router
