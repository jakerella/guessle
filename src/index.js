// Pull in a .env file if present
require('dotenv').config()

const express = require('express')
const { createClient } = require('redis')
const session = require('express-session')
const AppError = require('./util/AppError')

// Require the routes
const game = require('./routes/game')
const stats = require('./routes/stats')
const history = require('./routes/history')

// set default env vars
const PORT = process.env['PORT'] || 80
const SESS_SECRET = process.env.GUESSLE_SESS_SECRET || 'mytimestampbringsalltheboystotheyard-' + Date.now()


// Express app setup
const app = express()
app.use(express.static('static'))
app.set('view engine', 'pug')
app.use(express.json())


// Set up the express session management with Redis
let RedisStore = require('connect-redis')(session)
let redisSessionClient = createClient(process.env.REDIS_URL)
redisSessionClient.on('error', (err) => {
    console.error('Unable to maintain redis connection for session storage. Stopping server.')
    console.error(err.message)
    process.exit(1)
})
app.use(session({
    secret: SESS_SECRET,
    store: new RedisStore({ client: redisSessionClient }),
    resave: false,
    name: 'guessle',
    saveUninitialized: false
}))


// Add in our routes
app.use('/stats', stats)
app.use('/history', history)
app.use('/', game)  // the game is mounted to the root route, so needs to be last


// Kill any leftover cache connections
app.use(async (req, res, next) => {
    if (req.cacheClient) {
        try {
            await req.cacheClient.quitAsync()
        } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
    }
    next()
})


// 404 catcher, then error catchall
app.use((req, res, next) => {
    next(new AppError('Sorry, but I could not find that page.', 404))
})
app.use(async (err, req, res, next) => {
    if (!err.status || err.status > 499) {
        if (process.env.NODE_ENV === 'development') {
            console.error(err)
        } else {
            console.error(err.message)
        }
    }

    if (req.cacheClient) {
        try {
            await req.cacheClient.quitAsync()
        } catch(err) { /* Don't care because I would just log this, and we log it in the cache util */ }
    }
    
    res.status(err.status || 500)
    res.render('error', {
        page: 'error',
        title: 'Error',
        errorMessage: (err.status === 500) ? 'Sorry, we ran into a problem.' : err.message
    })
})


// here we go...
app.listen(PORT, () => {
    console.info(`Guessle app listening at http://localhost:${PORT}`)
})
