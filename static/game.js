
const pastGuesses = document.querySelector('.past-guesses')
const inputs = Array.from(document.querySelectorAll('.input.letter'))
const submitGuessEl = document.querySelector('#submit-guess')
const guessInfo = document.querySelector('.guess-info')
const gameHelp = document.querySelector('.game-help')
gameHelp.style.display = 'none'

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
    if (e.target.innerText.includes('give up')) {
        const resp = await fetch('/answer')
        const result = await resp.json()
        if (resp.status === 200) {
            window.alert(`No problem! The answer was: ${result.solution}`)
        }
    }
})

document.querySelector('.help').addEventListener('click', toggleHelp)
document.querySelector('.options').addEventListener('click', showOptions)


function toggleHelp() {
    gameHelp.style.display = (gameHelp.style.display === 'none') ? 'block' : 'none'
}

function showOptions() {
    console.log('options?')
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
            document.querySelector('.game-board').innerHTML += [
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

;(async () => {
    const resp = await fetch('/status')
    if (resp.status === 200) {
        showLetterHints((await resp.json()).guesses)
    }
})()