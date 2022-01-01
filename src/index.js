const express = require('express')
const session = require('express-session')
const AppError = require('./util/AppError')

// All the routes
const game = require('./routes/game')

// env vars and other config
const PORT = process.env['PORT'] || 80


// start it up
const app = express()

app.use(express.static('static'))
app.set('view engine', 'pug')
app.use(express.json())


const sessionOptions = {
    secret: process.env.WORDLE_SECRET,
    resave: false,
    name: 'wordle',
    saveUninitialized: false
}
if (process.env.NODE_ENV !== 'development') {
    app.set('trust proxy', 1)
    sessionOptions.cookie.secure = true
}
app.use(session(sessionOptions))


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
    console.info(`Wordle app listening at http://localhost:${PORT}`)
})
