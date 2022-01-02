
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


//------------------ Check for options -------------------- //
const OPTIONS_KEY = 'guessle-options'
let blankOptions = JSON.stringify({ dark: false, duplicateLetters: true, wordLength: 5 })
let options = localStorage.getItem(OPTIONS_KEY)
if (options) {
    try {
        options = JSON.parse(options)
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
        handleKeyboardEntry(e.code[3].toLocaleLowerCase())
    } else if (e.code === 'Backspace') {
        handleKeyboardEntry('del')
    } else if (e.code === 'Enter') {
        submitGuess()
    } else if (e.code === 'Slash') {  // "?" is Shift-Slash, but we'll just capture either
        toggleHelp()
    }
})

submitGuessEl.addEventListener('click', submitGuess)

document.querySelector('.new-word').addEventListener('click', async (e) => {
    await newWord(e.target.innerText.includes('give up'))
})

document.querySelector('.help').addEventListener('click', toggleHelp)
document.querySelector('.close-help').addEventListener('click', toggleHelp)
document.querySelector('.options').addEventListener('click', toggleOptions)
document.querySelector('.close-options').addEventListener('click', toggleOptions)


document.querySelector('.reset-stats').addEventListener('click', () => {
    stats = JSON.parse(blankStats)
    localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    showStats(stats)
})

gameOptionsEl.querySelector('#dark-mode').addEventListener('change', toggleDarkMode)


//------------------ Main event handlers -------------------- //

function toggleHelp() {
    gameHelp.style.display = (gameHelp.style.display === 'none') ? 'block' : 'none'
}

function toggleOptions() {
    gameOptionsEl.style.display = (gameOptionsEl.style.display === 'none') ? 'block' : 'none'
}

function toggleDarkMode() {
    options.dark = !options.dark
    console.log(options);
    if (options.dark) {
        document.body.classList.add('dark-mode')
    } else {
        document.body.classList.remove('dark-mode')
    }
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(options))
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

async function newWord(giveUp) {
    if (giveUp) {
        stats.played++
        stats.quit++
        localStorage.setItem(STATS_KEY, JSON.stringify(stats))
        const resp = await fetch('/answer')
        const result = await resp.json()
        if (resp.status === 200) {
            window.alert(`No problem! The answer was: ${result.solution}`)
        }
    }
}

async function submitGuess() {
    const guess = inputs.map((el) => el.innerText.trim().toLowerCase()).filter((l) => !!l).join('')
    if (guess.length !== inputs.length || !/^[a-z]+$/.test(guess)) {
        return setMessage(`Please enter a ${inputs.length}-letter word.`)
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
                stats.guessAvg = (stats.guessAvg + result.guesses.length) / 2
            } else {
                stats.guessAvg = result.guesses.length
            }
            stats.played++
            stats.won++
            localStorage.setItem(STATS_KEY, JSON.stringify(stats))
            showStats(stats)

            gameBoard.innerHTML += [
                `<p class='solution-info'>Congratulations! You solved this Guessle in 
                <strong>${result.guesses.length}</strong> guess${(result.guesses.length === 1) ? '' : 'es'}!
                <br><br>
                The word was <a target='_blank' href='https://www.google.com/search?q=define+${guess}'>${guess}</a>
                </p>`
            ]
            document.querySelector('.guess-inputs').style.display = 'none'
            document.querySelector('a.new-word').innerText = 'New Word Please!'
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
}

function setMessage(msg, type='error') {
    clearMessage()
    guessInfo.innerText = msg
    guessInfo.classList.add(type)
    guessInfo.style.display = 'block'
}

function clearMessage() {
    guessInfo.style.display = 'none'
    guessInfo.innerText = ''
    guessInfo.classList.remove('error')
    guessInfo.classList.remove('info')
    guessInfo.classList.remove('success')
}


//------------------ Get current game status from server -------------------- //

;(async () => {
    const resp = await fetch('/status')
    if (resp.status === 200) {
        const guesses = (await resp.json()).guesses
        showLetterHints(guesses)

        
    }
})()