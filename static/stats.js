
// ------------------ Check for options -------------------- //
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
if (options.dark) {
    document.body.classList.add('dark-mode')
}

// ------------------ Convert the startTime to date display -------------------- //
const startTimeEl = document.querySelector('.start-time')
const startDate = new Date(Number(startTimeEl.innerText))
startTimeEl.setAttribute('data-starttime', startTimeEl.innerText)
startTimeEl.innerText = startDate.toLocaleDateString()


// ------------------ Add players stats from localstorage -------------------- //

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


function showStats(stats) {
    const playerStatsEl = document.querySelector('.player-stats')
    playerStatsEl.querySelector('.games-played').innerText = stats.played
    playerStatsEl.querySelector('.games-won').innerText = stats.won
    playerStatsEl.querySelector('.games-quit').innerText = stats.quit
    playerStatsEl.querySelector('.guess-average').innerText = stats.guessAvg
    if (stats.played > 0) {
        playerStatsEl.querySelector('.games-won-percent').innerText = Math.round((stats.won / stats.played) * 100)
        playerStatsEl.querySelector('.games-quit-percent').innerText = Math.round((stats.quit / stats.played) * 100)
    }
}
