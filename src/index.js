require('dotenv').config()

const express = require('express')
const redis = require('redis')
const session = require('express-session')
const AppError = require('./util/AppError')

// All the routes
const game = require('./routes/game')
const stats = require('./routes/stats')
const history = require('./routes/history')

// env vars and other config
const PORT = process.env['PORT'] || 80


// start it up
const app = express()

app.use(express.static('static'))
app.set('view engine', 'pug')
app.use(express.json())


let RedisStore = require('connect-redis')(session)
let redisSessionClient = redis.createClient(process.env.REDIS_URL)
redisSessionClient.on('connect', () => { console.log('Connected to Redis for session storage') })
redisSessionClient.on('error', (err) => {
    console.error('Unable to maintain redis connection for session storage. Stopping server.')
    console.error(err)
    process.exit(1)
})
const sessionOptions = {
    secret: process.env.GUESSLE_SESS_SECRET,
    store: (RedisStore) ? new RedisStore({ client: redisSessionClient }) : null,
    resave: false,
    name: 'guessle',
    saveUninitialized: false
}
app.use(session(sessionOptions))


app.use('/stats', stats)
app.use('/history', history)
app.use('/', game)


// 404 catcher
app.use((req, res, next) => {
    next(new AppError('Sorry, but I could not find that page.', 404))
})

app.use((err, req, res, next) => {
    if (!err.status || err.status > 499) {
        console.error(err)
    }
    
    res.status(err.status || 500)
    res.render('error', {
        page: 'error',
        title: 'Error',
        message: (err.status === 500) ? 'Sorry, we ran into a problem.' : err.message
    })
})


// here we go...
app.listen(PORT, () => {
    console.info(`Guessle app listening at http://localhost:${PORT}`)
})
