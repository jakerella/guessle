
const express = require('express')
const requestIp = require('request-ip')
const { getStats } = require('../util/stats')
const { getClient } = require('../util/cache')
const AppError = require('../util/AppError')

const router = express.Router()


router.get('/', async (req, res, next) => {
    if (req.session.adminKey !== process.env.ADMIN_KEY) {
        return res.render('admin-login', {
            page: 'Log In',
            title: 'Guessle Admin',
            error: null,
            info: null
        })
    }

    console.log(`Admin page accessed by IP address: ${requestIp.getClientIp(req)}`)

    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    const stats = await getStats(req.cacheClient)

    res.render('admin', {
        page: 'admin',
        title: 'Guessle Admin',
        error: null,
        info: null,
        stats,
        disabled: process.env.DISABLE_STATS === 'true' || false
    })

    try {
        await req.cacheClient.quitAsync()
    } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
})

router.post('/login', async (req, res, next) => {
    if (req.body.key === process.env.ADMIN_KEY) {
        req.session.adminKey = req.body.key
        return res.redirect('/admin')
    } else {
        return next(new AppError('You are not authorized to access this page.', 401))
    }
})

module.exports = router
