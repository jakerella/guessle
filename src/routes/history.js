const express = require('express')

const router = express.Router()

router.use((req, res, next) => {
    // We call this "userId" so that we could use something else in the future if we want
    req.session.userId = requestIp.getClientIp(req)
    next()
})

router.get('/', async (req, res) => {
    res.render('history', {
        page: 'history',
        title: 'Game History',
        error: null,
        info: null,
        userId: req.session.userId,
        isAdmin: (req.session.adminKey === process.env.ADMIN_KEY)
    })
})


module.exports = router
