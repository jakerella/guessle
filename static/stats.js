
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

const HISTORY_KEY = 'guessle-history'

document.querySelector('.clear-history').addEventListener('click', (e) => {
    e.preventDefault()
    if (window.confirm('Are you sure you want to clear your game history and reset your stats?')) {
        localStorage.setItem(HISTORY_KEY, '[]')
        updatePlayerStats()
    }
})

updatePlayerStats()

calculatePerDayStats(globalStats)

const guessCounts = []
for (let guesses in globalStats.guessFreq) {
    for (let i=0; i<globalStats.guessFreq[guesses]; ++i) {
        guessCounts.push(Number(guesses))
    }
}
makeGuessChart(guessCounts, document.querySelector('.global-chart.stat-chart'))


function calculatePerDayStats(globalStats) {
    let totalPlayed = 0
    let totalPlayers = 0
    for (let id in globalStats.playerResults) {
        for (let day in globalStats.playerResults[id]) {
            totalPlayers++
            totalPlayed += (globalStats.playerResults[id][day][0] + globalStats.playerResults[id][day][1])
        }
    }
    
    const daysPast = Math.ceil((Date.now() - globalStats.playerResults.s) / 86400000)
    
    const ppd = Math.round((totalPlayers / daysPast) * 10) / 10
    const gpd = Math.round((totalPlayed / daysPast) * 10) / 10
    document.querySelector('.players-per-day .value').innerText = ppd
    document.querySelector('.games-per-day .value').innerText = gpd
    
    if (globalStats.startTime !== globalStats.playerResults.s) {
        document.querySelector('.players-per-day .since').innerText = `(since ${(new Date(globalStats.playerResults.s)).toLocaleDateString()})`
        document.querySelector('.games-per-day .since').innerText = `(since ${(new Date(globalStats.playerResults.s)).toLocaleDateString()})`
    }
}


function updatePlayerStats() {
    try {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY))
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

            makeGuessChart(stats.guessCounts, document.querySelector('.player-chart.stat-chart'))
        }

    } catch(err) {
        console.warn('Bad player history:', err.message)
    }
}


function makeGuessChart(guessCounts, chartEl) {
    const countMap = guessCounts.reduce((acc, count) => {
        acc[count] = (acc[count]) ? acc[count] + 1 : 1
        return acc
    }, [])

    let tenPlusTally = 0
    countMap.forEach((tally, guess) => {
        if (guess < 10) {
            const share = Math.round((tally / guessCounts.length) * 100)
            chartEl.querySelector(`.count-${guess}`).innerHTML = `<span class='stat-bar' style='height:${share}px;'></span>`
        } else {
            tenPlusTally += tally
        }
    })
    const tenPlusShare = Math.round((tenPlusTally / guessCounts.length) * 100)
    chartEl.querySelector(`.count-more`).innerHTML = `<span class='stat-bar' style='height:${tenPlusShare}px;'></span>`
}
