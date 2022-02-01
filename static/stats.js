
// ------------------ Check for dark mode -------------------- //
try {
    const options = JSON.parse(localStorage.getItem('guessle-options'))
    if (options && options.dark) { document.body.classList.add('dark-mode') }
} catch(e) { /* don't care... */ }

// ------------------ Convert the startTime to date display -------------------- //
const startTimeEl = document.querySelector('.start-time')
const startDate = new Date(Number(startTimeEl.innerText))
startTimeEl.setAttribute('data-starttime', startTimeEl.innerText)
startTimeEl.innerText = startDate.toLocaleDateString()


// ------------------ Add players stats from localstorage -------------------- //

try {
    const history = JSON.parse(localStorage.getItem('guessle-history'))
    if (history) {
        const stats = { played: 0, won: 0, quit: 0, guessCounts: [] }

        history.forEach((game) => {
            stats.played++
            const guesses = game.split('|')[0].split('>')
            stats.guessCounts.push(guesses.length)
            if (/^[2]+$/.test(guesses.pop())) { stats.won++ } else { stats.quit++ }
        })

        const playerStatsEl = document.querySelector('.player-stats')
        playerStatsEl.querySelector('.games-played').innerText = stats.played
        playerStatsEl.querySelector('.games-won').innerText = stats.won
        playerStatsEl.querySelector('.games-quit').innerText = stats.quit
        if (stats.played > 0) {
            playerStatsEl.querySelector('.games-won-percent').innerText = Math.round((stats.won / stats.played) * 100)
            playerStatsEl.querySelector('.games-quit-percent').innerText = Math.round((stats.quit / stats.played) * 100)
            playerStatsEl.querySelector('.guess-average').innerText = Math.round(((stats.guessCounts.reduce((t, v) => t+v, 0)) / stats.guessCounts.length) * 10) / 10
        }
    }

} catch(err) {
    console.warn('Bad player history:', err.message)
}
