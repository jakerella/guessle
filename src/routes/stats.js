
const express = require('express')
const requestIp = require('request-ip')
const { getStats, addPlayerResult, setStatsStart, resetAllStats, GUESS_COUNTS_KEY, PLAYERS_KEY, PLAYER_RESULTS_KEY } = require('../util/stats')
const { getClient } = require('../util/cache')
const AppError = require('../util/AppError')

const router = express.Router()


router.use((req, res, next) => {
    // We call this "userId" so that we could use something else in the future if we want
    req.session.userId = requestIp.getClientIp(req)
    next()
})

router.get('/', async (req, res, next) => {
    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    const stats = await getStats(req.cacheClient)

    if (process.env.NODE_ENV === 'development') { console.debug(stats) }

    res.render('stats', {
        page: 'stats',
        title: 'Game Stats',
        error: null,
        info: null,
        stats,
        disabled: process.env.DISABLE_STATS === 'true' || false,
        userId: req.session.userId,
        isAdmin: (req.session.adminKey === process.env.ADMIN_KEY)
    })

    try {
        await req.cacheClient.quitAsync()
    } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
})


router.get('/add-player-result', async (req, res, next) => {
    if (req.query.key !== process.env.ADMIN_KEY) {
        return next(new AppError('You are not authorized to perform this action.', 401))
    }

    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    if (!req.query.player || !req.query.result) {
        return next(new AppError('You must provide at least a player ID (IP, etc) and result (number of guesses, or 0 for quit).', 401))
    }

    const cacheClient = getClient(process.env.REDIS_URL)
    if (!cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }
    
    try {
        await addPlayerResult(cacheClient, req.query.player, Number(req.query.result) || 0, Number(req.query.day) || 0)
    } catch(err) {
        console.warn(err)
        return next(new AppError(err.message, 400))
    }

    res.redirect('/stats')
})


router.get('/set-start', async (req, res, next) => {
    if (req.query.key !== process.env.ADMIN_KEY) {
        return next(new AppError('You are not authorized to perform this action.', 401))
    }

    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    if (!req.query.start) {
        return next(new AppError('You must provide a start date or timestamp', 401))
    }

    const start = new Date(Number(req.query.start) || req.query.start)
    if (!start || !start.getTime()) {
        return next(new AppError('You must provide a valid start date string or timestamp', 401))
    }

    const cacheClient = getClient(process.env.REDIS_URL)
    if (!cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }
    
    try {
        await setStatsStart(cacheClient, start.getTime())
    } catch(err) {
        console.warn(err)
        return next(new AppError(err.message, 400))
    }

    res.redirect('/stats')
})


router.get('/reset', async (req, res, next) => {
    if (req.query.key === process.env.ADMIN_KEY) {
        const cacheClient = getClient(process.env.REDIS_URL)
        if (!cacheClient) {
            return next(new AppError('No cache client present in session', 500))
        }

        try {
            await resetAllStats(cacheClient)
        } catch(err) {
            console.warn(err)
            return next(new AppError(err.message, 400))
        }
        res.redirect('/stats')

    } else {
        return next(new AppError('You are not authorized to perform this action.', 401))
    }
})


module.exports = router
