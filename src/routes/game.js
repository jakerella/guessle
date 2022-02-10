const express = require('express')
const { generateGame, makeGuess, isGameSolved } = require('../logic/game')
const { getClient } = require('../util/cache')
const { incrementStats, addValueToList, GUESS_COUNTS_KEY, PLAYERS_KEY } = require('../util/stats')

const router = express.Router()

router.get('/', (req, res) => {
    req.session.options = req.session.options || null

    if (typeof(req.query.new) === 'string') {
        req.session.game = generateGame(req.session.options)
        return res.redirect('/')
    }

    let game = req.session.game || { word: '' }

    if (process.env.NODE_ENV === 'development') {
        console.log('current game', game)
    }

    res.render('home', {
        page: 'home',
        title: '',
        error: null,
        info: null,
        options: JSON.stringify(req.session.options),
        guesses: game.guesses || [],
        wordLength: game.word.length || 5,
        solved: game.solved || false,
        solution: (game.solved) ? game.word : null
    })
})

router.get('/guess', async (req, res) => {
    if (!req.session.game) {
        res.status(400)
        return res.json({ status: 400, message: 'There is no active game.' })
    }

    if (!req.query.w || !req.query.w.length === req.session.game.word.length) {
        res.status(400)
        return res.json({ status: 400, message: `Please guess a ${req.session.game.word.length}-letter word.` })
    }

    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    let guess = null
    try {
        guess = makeGuess(req.session.game, req.query.w)
    } catch(err) {
        res.status(err.status)
        return res.json({ message: err.message })
    }
    req.session.game.guesses.push(guess)
    const solved = isGameSolved(req.session.game)
    req.session.game.solved = solved
    if (solved && process.env.DISABLE_STATS !== 'true') {
        try {
            const stats = await incrementStats(req.cacheClient, ['gamesPlayed', 'gamesWon'])
            if (stats) {
                await addValueToList(req.cacheClient, GUESS_COUNTS_KEY, req.session.game.guesses.length)
                if (req.ip) {
                    await addValueToList(req.cacheClient, PLAYERS_KEY, req.ip, true)
                }
            }
        } catch(err) {
            console.warn('Unable to write global stats (win):', err.message)
            // Let this error go, we just won't write this win's result to global stats
        }
    }

    res.json({
        guesses: req.session.game.guesses,
        guess,
        solved
    })

    try {
        await req.cacheClient.quitAsync()
    } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
})

router.get('/status', (req, res) => {
    if (!req.session.game) {
        if (req.query.generate === 'true') {
            game = generateGame(req.session.options || {})
            req.session.game = game
        } else {
            res.status(404)
            return res.json({ status: 404, message: 'There is no active game.' })
        }
    }

    res.json({
        guesses: req.session.game.guesses,
        wordLength: req.session.game.word.length,
        solved: req.session.game.solved || false
    })
})

router.get('/options', (req, res) => {
    req.session.options = req.session.options || {}
    
    if (req.query.length) {
        let wordLength = Number(req.query.length)
        req.session.options.wordLength = (wordLength === 5 || wordLength === 6) ? wordLength : 5
    }
    if (req.query.depth) {
        req.session.options.depth = Number(req.query.depth) || 2
    }
    if (req.query.dupeLetters && req.query.dupeLetters === 'false') {
        req.session.options.dupeLetters = false
    } else {
        req.session.options.dupeLetters = true
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('Set new options to', req.session.options)
    }

    res.json(req.session.options)
})

router.get('/answer', async (req, res) => {
    if (!req.session.game) {
        res.status(400)
        return res.json({ status: 400, message: 'There is no active game.' })
    }

    req.cacheClient = getClient(process.env.REDIS_URL)
    if (!req.cacheClient) {
        return next(new AppError('No cache client present in session', 500))
    }

    const solution = req.session.game.word
    const guesses = req.session.game.guesses
    req.session.game = null
    
    if (process.env.DISABLE_STATS !== 'true') {
        try {
            await incrementStats(req.cacheClient, ['gamesPlayed', 'gamesQuit'])
            if (req.ip) {
                await addValueToList(req.cacheClient, PLAYERS_KEY, req.ip, true)
            }
        } catch(err) {
            console.warn('Unable to write global stats (give up):', err.message)
            // Let this error go, we just won't write this win's result to global stats
        }
    }

    res.json({
        guesses,
        solution
    })

    try {
        await req.cacheClient.quitAsync()
    } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
})

router.get('/dictionary', (req, res) => {
    res.json({
        5: require(`../../lists/scrabble_5.json`),
        6: require(`../../lists/scrabble_6.json`)
    })
})


module.exports = router
