const express = require('express')
const { generateGame, makeGuess, isGameSolved } = require('../logic/game')
const { incrementStats, addNewStat, addValueToList } = require('../util/stats')

const router = express.Router()

router.get('/', (req, res) => {
    req.session.options = req.session.options || {}

    if (typeof(req.query.new) === 'string') {
        req.session.game = generateGame(req.session.options)
        return res.redirect('/')
    }

    let game = req.session.game || null
    if (!game) {
        game = generateGame(req.session.options)
        req.session.game = game
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('current game', game)
    }

    res.render('home', {
        page: 'home',
        title: '',
        error: null,
        info: null,
        guesses: game.guesses,
        wordLength: game.word.length,
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
        const stats = await incrementStats(['gamesPlayed', 'gamesWon'])
        let totalGuessAvg = req.session.game.guesses.length
        if (stats.guessAverage) {
            totalGuessAvg = Math.round(((stats.guessAverage + totalGuessAvg) / 2) * 10) / 10
        }
        await addNewStat('guessAverage', totalGuessAvg)
        if (req.ip) {
            await addValueToList('players', req.ip, true)
        }
    }

    res.json({
        guesses: req.session.game.guesses,
        guess,
        solved
    })
})

router.get('/status', (req, res) => {
    if (!req.session.game) {
        res.status(400)
        return res.json({ status: 400, message: 'There is no active game.' })
    }

    res.json({
        guesses: req.session.game.guesses,
        solved: req.session.game.solved || false
    })
})

router.get('/options', (req, res) => {
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

    const solution = req.session.game.word
    const guesses = req.session.game.guesses
    req.session.game = null
    
    if (process.env.DISABLE_STATS !== 'true') {
        await incrementStats(['gamesPlayed', 'gamesQuit'])
        if (req.ip) {
            await addValueToList('players', req.ip, true)
        }
    }

    res.json({
        guesses,
        solution
    })
})

router.get('/dictionary', (req, res) => {
    res.json({
        5: require(`../../lists/scrabble_5.json`),
        6: require(`../../lists/scrabble_6.json`)
    })
})


module.exports = router
