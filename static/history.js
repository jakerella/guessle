
let gameHistory = []
try {
    gameHistory = JSON.parse(localStorage.getItem('guessle-history'))
    if (!Array.isArray(gameHistory)) { gameHistory = [] }
} catch(err) {
    console.warn('Bad history:', err.message)
    gameHistory = []
}


const historyElements = gameHistory.reverse().map((game) => {
    const [ guessString, answer ] = game.split('|')
    const guesses = guessString.split('>')
    const gameResult = (/^[2]+$/.test(guesses[guesses.length-1][1])) ? 'game-win' : 'game-loss'

    const gameEl = `
    <li class='game ${gameResult}'>
        <header class='game-header'>
            <h3>${answer}</h3>
            <p>
                ${(gameResult === 'game-win') ? `Won in ${guesses.length} guess${(guesses.length === 1) ? '' : 'es'}!` : `Gave up after ${guesses.length} guess${(guesses.length === 1) ? '' : 'es'}.`}
                <span class='toggle-guesses' title='Show or hide your guesses for this game'></span>
            </p>
        </header>
        <ul class='guesses hidden'>
            ${guesses.map((guess) => {
                return `<li class='history-guess'>
                    ${guess.split('').map((check) => `<span class='check-${check}'></span>`).join('')}
                </li>`
            }).join('\n')}
        </ul>
    </li>`
    
    return gameEl
})

if (gameHistory.length) {
    document.querySelector('ul.history').innerHTML = historyElements.join('\n')
} else {
    document.querySelector('ul.history').innerHTML = '<li>(no history yet)</li>'
}

document.querySelector('ul.history').addEventListener('click', (e) => {
    if (e.target.parentNode.classList.contains('game-header')) {
        toggleGameGuesses(e.target.parentNode.parentNode)
    }
})

document.querySelector('.clear-history').addEventListener('click', (e) => {
    e.preventDefault()
    if (window.confirm('Are you sure you want to clear your game history?')) {
        localStorage.setItem('guessle-history', '[]')
        document.querySelector('ul.history').innerHTML = '<li>(no history yet)</li>'
    }
})


function toggleGameGuesses(el) {
    const guessesEl = el.querySelector('.guesses')
    if (guessesEl) {
        if (guessesEl.classList.contains('hidden')) {
            el.classList.add('showing-guesses')
            guessesEl.classList.remove('hidden')
        } else {
            el.classList.remove('showing-guesses')
            guessesEl.classList.add('hidden')
        }
    }
}
