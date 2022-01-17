const express = require('express')

const router = express.Router()

router.get('/', async (req, res) => {
    res.render('history', {
        page: 'history',
        title: 'Game History',
        error: null,
        info: null
    })
})


module.exports = router
