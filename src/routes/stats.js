const express = require('express')
const { getStats } = require('../util/stats')

const router = express.Router()

router.get('/', async (req, res) => {
    const stats = await getStats()

    if (process.env.NODE_ENV === 'development') {
        console.log('current stats:', stats)
    }

    res.render('stats', {
        page: 'stats',
        title: 'Game Stats',
        error: null,
        info: null,
        stats
    })
})


module.exports = router
