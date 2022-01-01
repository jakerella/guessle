
const pastGuesses = document.querySelector('.past-guesses')
const inputs = Array.from(document.querySelectorAll('input.letter'))
const submitGuessEl = document.querySelector('#submit-guess')
const guessInfo = document.querySelector('.guess-info')

const letterHints = {}
Array.from(document.querySelectorAll('.all-letters .letter')).forEach((letterEl) => {
    letterHints[letterEl.innerText] = letterEl
})

inputs[0].focus()

inputs.forEach((el) => {
    el.addEventListener('keydown', (e) => {
        if (e.keyCode === 13) {
            e.stopPropagation()
            submitGuess()
            return false
        } else if (e.keyCode === 8) {
            const index = Number(e.target.id.split('-')[1])
            if (!e.target.value && index > 0) {
                inputs[index-1].focus()
            }
        }
    })

    el.addEventListener('input', (e) => {
        if (e.inputType === 'insertText') {
            const index = Number(e.target.id.split('-')[1])
            if (index < 4) {
                inputs[index+1].focus()
            } else {
                submitGuessEl.focus()
            }
        }
    })
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


async function submitGuess() {
    const guess = inputs.map((el) => el.value.trim().toLowerCase()).filter((l) => !!l).join('')
    if (guess.length !== inputs.length || !/^[a-z]+$/.test(guess)) {
        return setMessage(`Please enter a ${inputs.length}-letter word.`)
    }

    clearMessage()
    const resp = await fetch(`/guess?w=${guess}`)
    const result = await resp.json()
    if (resp.status === 200) {
        addGuess(result.guess)
        showLetterHints(result.guesses)
        inputs.forEach((el) => { el.value = '' })
        inputs[0].focus()
        if (result.solved) {
            document.querySelector('#game-board').innerHTML += `<p class='solution-info'>Congratulations! You solved this Wordle in <strong>${result.guesses.length}</strong> guess(es)!</p>`
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