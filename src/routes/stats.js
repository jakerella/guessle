const express = require('express')
const { getStats } = require('../util/stats')
const { getClient } = require('../util/cache')
const AppError = require('../util/AppError')

const router = express.Router()

router.get('/', async (req, res, next) => {
    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    const stats = await getStats(req.cacheClient)

    res.render('stats', {
        page: 'stats',
        title: 'Game Stats',
        error: null,
        info: null,
        stats,
        disabled: process.env.DISABLE_STATS === 'true' || false
    })

    try {
        await req.cacheClient.quitAsync()
    } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
})


module.exports = router
