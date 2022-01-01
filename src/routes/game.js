const express = require('express')
const router = express.Router()


router.get('/', async (req, res) => {
    // generate new game?

    res.render('home', {
        page: 'home',
        title: '',
        error: null,
        info: null
    })
})

module.exports = router
