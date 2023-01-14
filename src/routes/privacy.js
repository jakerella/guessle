
const express = require('express')
const requestIp = require('request-ip')

const router = express.Router()

router.use((req, res, next) => {
    // We call this "userId" so that we could use something else in the future if we want
    req.session.userId = requestIp.getClientIp(req)
    next()
})

router.get('/', async (req, res, next) => {
    res.render('privacy', {
        page: 'privacy',
        title: 'Privacy Policy',
        error: null,
        info: null,
        userId: req.session.userId,
        isAdmin: (req.session.adminKey === process.env.ADMIN_KEY)
    })
})

module.exports = router
