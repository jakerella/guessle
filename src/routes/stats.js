const express = require('express')
const { getStats, resetAllStats, GUESS_COUNTS_KEY, PLAYERS_KEY } = require('../util/stats')
const { getClient } = require('../util/cache')
const AppError = require('../util/AppError')

const router = express.Router()

router.get('/', async (req, res, next) => {
    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    const stats = await getStats(req.cacheClient)
    stats[PLAYERS_KEY] = await getStats(req.cacheClient, PLAYERS_KEY) || []
    stats.guessCounts = await getStats(req.cacheClient, GUESS_COUNTS_KEY) || []

    if (stats.guessCounts.length) {
        stats.guessAverage = Math.round(((stats.guessCounts.reduce((t, v) => t+v, 0)) / stats.guessCounts.length) * 10) / 10
    } else {
        stats.guessAverage = 0
    }

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


router.get('/reset', async (req, res, next) => {
    if (req.query.key === process.env.ADMIN_KEY) {
        const cacheClient = getClient(process.env.REDIS_URL)
        if (!cacheClient) {
            return next(new AppError('No cache client present in session', 500))
        }
        await resetAllStats(cacheClient)
        res.redirect('/stats')

    } else {
        return next(new AppError('You are not authorized to perform this action.', 401))
    }
})


module.exports = router
