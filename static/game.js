
//------------------ Cache some DOM elements -------------------- //
const gameBoard = document.querySelector('.game-board')
const pastGuesses = document.querySelector('.past-guesses')
const inputs = Array.from(document.querySelectorAll('.input.letter'))
const submitGuessEl = document.querySelector('#submit-guess')
const guessInfo = document.querySelector('.guess-info')
const gameHelp = document.querySelector('.game-help')
gameHelp.style.display = 'none'
const gameOptionsEl = document.querySelector('.game-options')
gameOptionsEl.style.display = 'none'
const gameStats = document.querySelector('.stats')
let dictionary = null


//------------------ Check for options -------------------- //
const OPTIONS_KEY = 'guessle-options'
let blankOptions = JSON.stringify({ dark: false, depth: 2, duplicateLetters: true, wordLength: 5 })
let options = localStorage.getItem(OPTIONS_KEY)
if (options) {
    try {
        options = { ...JSON.parse(blankOptions), ...JSON.parse(options) }
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
    } catch(err) {
        console.warn('Bad options:', err.message)
        options = JSON.parse(blankOptions)
        localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
    }
} else {
    options = JSON.parse(blankOptions)
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
}
initOptions(options)


//------------------ Check for stats -------------------- //
const STATS_KEY = 'guessle-stats'
let blankStats = JSON.stringify({ played: 0, won: 0, quit: 0, guessAvg: 0 })
let stats = localStorage.getItem(STATS_KEY)
if (stats) {
    try {
        stats = JSON.parse(stats)
        if (stats.played !== (stats.won + stats.quit)) {
            throw new Error('Stats look out of balance, so unfortunately they are getting reset: ' + JSON.stringify(stats))
        }
    } catch(err) {
        console.warn('Bad stats:', err.message)
        stats = JSON.parse(blankStats)
        localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    }
} else {
    stats = JSON.parse(blankStats)
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}
showStats(stats)


//------------------ Set up game listeners -------------------- //

const letterHints = {}
Array.from(document.querySelectorAll('.all-letters .letter')).forEach((letterEl) => {
    letterHints[letterEl.innerText] = letterEl
    letterEl.addEventListener('click', (e) => { handleKeyboardEntry(e.target.innerText) })
})

document.body.addEventListener('keydown', (e) => {
    if (/^Key([A-Z]$)/.test(e.code)) {
        handleKeyboardEntry(e.key.toLocaleLowerCase())
    } else if (e.code === 'Backspace') {
        handleKeyboardEntry('del')
    } else if (e.code === 'Enter') {
        submitGuess()
    } else if (e.code === 'Slash') {  // "?" is Shift-Slash, but we'll just capture either
        toggleHelp()
    }
})

if (submitGuessEl) {
    submitGuessEl.addEventListener('click', submitGuess)
}

document.querySelector('.give-up').addEventListener('click', async (e) => {
    e.preventDefault()
    giveUp()
    return false
})

document.querySelector('.help').addEventListener('click', toggleHelp)
document.querySelector('.close-help').addEventListener('click', toggleHelp)
document.querySelector('.options').addEventListener('click', toggleOptions)
document.querySelector('.close-options').addEventListener('click', () => {
    toggleOptions()
    sendServerOptions(options)
})


document.querySelector('.reset-stats').addEventListener('click', () => {
    if (window.confirm('Are you sure you want to reset your stats?')) {
        stats = JSON.parse(blankStats)
        localStorage.setItem(STATS_KEY, JSON.stringify(stats))
        showStats(stats)
    }
})

gameOptionsEl.querySelector('#dark-mode').addEventListener('change', toggleDarkMode)
Array.from(gameOptionsEl.querySelectorAll('[name="word-depth"]')).forEach((el) => {
    el.addEventListener('click', () => { setWordDepth(Number(el.value)) })
})
gameOptionsEl.querySelector('#dupe-letters').addEventListener('change', toggleDuplicateLetters)


//------------------ Main event handlers -------------------- //

function toggleHelp() {
    gameHelp.style.display = (gameHelp.style.display === 'none') ? 'block' : 'none'
}

function toggleOptions() {
    gameOptionsEl.style.display = (gameOptionsEl.style.display === 'none') ? 'block' : 'none'
}

function toggleDarkMode() {
    options.dark = !options.dark
    if (options.dark) {
        document.body.classList.add('dark-mode')
    } else {
        document.body.classList.remove('dark-mode')
    }
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
}

function setWordDepth(depth) {
    options.depth = (Number(depth)) ? Number(depth) : options.depth
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
    sendServerOptions(options)
}

function toggleDuplicateLetters() {
    options.duplicateLetters = !options.duplicateLetters
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
    sendServerOptions(options)
}

async function sendServerOptions(opts) {
    const resp = await fetch(`/options?depth=${opts.depth}&dupeLetters=${opts.duplicateLetters.toString()}`)
    if (resp.status !== 200) {
        console.warn('Unable to set options on server:', resp.status)
    }
}

function handleKeyboardEntry(letter) {
    if (letter === 'del') {
        let lastEl = null
        inputs.forEach((el) => {
            if (el.innerText) { lastEl = el }
        })
        lastEl.innerText = ''
    } else {
        for (let i=0; i<inputs.length; ++i) {
            if (!inputs[i].innerText) {
                inputs[i].innerText = letter
                break
            }
        }
    }
}

async function giveUp() {
    if (window.confirm('Are you sure you want to give up?')) {
        stats.played++
        stats.quit++
        localStorage.setItem(STATS_KEY, JSON.stringify(stats))
        const resp = await fetch('/answer')
        const surrender = document.querySelector('.surrender-info')
        if (resp.status === 200) {
            const result = await resp.json()
            const answer = surrender.querySelector('.answer')
            answer.innerText = result.solution
            answer.setAttribute('href', answer.getAttribute('href') + result.solution)
        } else {
            surrender.innerHTML = `You'll get it next time!<br>Sorry, but I wasn't able to retrieve the answer from the server.`
        }
        surrender.classList.remove('hidden')
        document.querySelector('.give-up').classList.add('hidden')
        document.querySelector('.new-word').classList.remove('hidden')
        document.querySelector('.guess-inputs').classList.add('hidden')
        submitGuessEl.classList.add('hidden')
    }
}

async function submitGuess() {
    const guess = inputs.map((el) => el.innerText.trim().toLowerCase()).filter((l) => !!l).join('')
    if (guess.length !== inputs.length || !/^[a-z]+$/.test(guess)) {
        return setMessage(`Please enter a ${inputs.length}-letter word.`)
    }
    if (dictionary && dictionary.length && !dictionary.includes(guess)) {
        return setMessage('Sorry, but I don\'t know that word.')
    }

    clearMessage()
    const resp = await fetch(`/guess?w=${guess}`)
    const result = await resp.json()
    if (resp.status === 200) {
        addGuess(result.guess)
        showLetterHints(result.guesses)
        inputs.forEach((el) => { el.innerText = '' })
        if (result.solved) {
            if (stats.guessAvg) {
                stats.guessAvg = Math.round(((stats.guessAvg + result.guesses.length) / 2) * 10) / 10
            } else {
                stats.guessAvg = result.guesses.length
            }
            stats.played++
            stats.won++
            localStorage.setItem(STATS_KEY, JSON.stringify(stats))
            showStats(stats)

            const solution = document.querySelector('.solution-info')
            solution.innerHTML = `Congratulations! You solved this Guessle in 
                <strong>${result.guesses.length}</strong> guess${(result.guesses.length === 1) ? '' : 'es'}!
                <br><br>
                The word was <a target='_blank' href='https://scrabble.merriam.com/finder/${guess}'>${guess}</a>.`
            solution.classList.remove('hidden')
            document.querySelector('.guess-inputs').classList.add('hidden')
            submitGuessEl.classList.add('hidden')
            document.querySelector('.give-up').classList.add('hidden')
            document.querySelector('.new-word').classList.remove('hidden')
        }
        document.querySelector('.actions').scrollIntoView()

    } else {
        setMessage(result.message)
    }
}

function addGuess(guess) {
    pastGuesses.innerHTML += [
        `<aside class='guess'>`,
        ...guess.map((letter) => {
            return `<span class='letter check-${letter.check}'>${letter.letter}</span>`
        }),
        '</aside>'
    ].join('')
}

function showLetterHints(guesses) {
    if (!Object.keys(letterHints).length) { return }
    guesses.forEach((guess) => {
        guess.forEach((guessLetter) => {
            letterHints[guessLetter.letter].classList.add(`check-${guessLetter.check}`)
        })
    })
}

function showStats(stats) {
    gameStats.querySelector('.play-count').innerText = stats.played
    gameStats.querySelector('.win-count').innerText = stats.won
    gameStats.querySelector('.quit-count').innerText = stats.quit
    gameStats.querySelector('.guess-avg').innerText = stats.guessAvg
    if (stats.played > 0) {
        gameStats.querySelector('.win-percent').innerText = Math.round((stats.won / stats.played) * 100)
        gameStats.querySelector('.quit-percent').innerText = Math.round((stats.quit / stats.played) * 100)
    }
}

function initOptions(options) {
    if (options.dark) {
        document.body.classList.add('dark-mode')
        gameOptionsEl.querySelector('#dark-mode').setAttribute('checked', 'checked')
    }
    gameOptionsEl.querySelector(`.word-depth[value="${options.depth}"]`).setAttribute('checked', 'checked')
    if (options.duplicateLetters) {
        gameOptionsEl.querySelector('#dupe-letters').setAttribute('checked', 'checked')
    }
}

function setMessage(msg, type='error') {
    clearMessage()
    guessInfo.innerText = msg
    guessInfo.classList.add(type)
    guessInfo.classList.remove('hidden')
}

function clearMessage() {
    guessInfo.classList.add('hidden')
    guessInfo.innerText = ''
    guessInfo.classList.remove('error')
    guessInfo.classList.remove('info')
    guessInfo.classList.remove('success')
}

async function retrieveDictionary() {
    try {
        console.info('Retrieving dictionary...')
        const resp = await fetch('/dictionary')
        if (resp.status === 200) {
            const dict = await resp.json()
            if (dict.length) {
                localStorage.setItem('guessle-dictionary', JSON.stringify(dict))
            }
            return dict
        }
        return null
    } catch(err) {
        return null
    }
}


//------------------ Some startup actions -------------------- //

;(async () => {
    console.info('Getting current game status...')
    const resp = await fetch('/status')
    if (resp.status === 200) {
        const guesses = (await resp.json()).guesses
        showLetterHints(guesses)        
    }

    try {
        dictionary = JSON.parse(localStorage.getItem('guessle-dictionary'))
        if (!dictionary) {
            dictionary = await retrieveDictionary()
        }
    } catch(err) {
        if (err instanceof SyntaxError) {
            dictionary = await retrieveDictionary()
        }
    }
})()
