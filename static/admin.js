
// ------------------ Check for dark mode -------------------- //
try {
    const options = JSON.parse(localStorage.getItem('guessle-options'))
    if (options && options.dark) { document.body.classList.add('dark-mode') }
} catch(e) { /* don't care... */ }


const queryParams = document.location.search.slice(1).split('&').reduce((q, e) => { const p = e.split('='); q[p[0]] = (q[p[0]]) ? [...q[p[0]], p[1]] : p[1]; return q }, {})
const daysInChart = Math.min(Number(queryParams.days) || 14, 60)
Array.from(document.querySelectorAll('.stat-chart .days')).forEach((e) => e.innerHTML = daysInChart)

const currDay = Math.floor((Date.now() - globalStats.playerResults.s) / 86400000)
const dailyTotals = {}
let maxDailyGames = 0
let maxDailyPlayers = 0
for (let i=currDay; i>-1 && i>(currDay-daysInChart); --i) {
    dailyTotals[i] = [0,0];  // [games,players]
}


const playerDailyActivityTotals = []
const playerTotalGames = []

const playerResultsTable = document.querySelector('.player-results tbody')
let zebra = false
for (let id in globalStats.playerResults) {
    if (id === 's') { continue; }
    const player = globalStats.playerResults[id]
    const dayIds = Object.keys(player).sort()

    let wins = 0
    let quits = 0
    dayIds.forEach((id) => {
        wins += player[id][0]
        quits += player[id][1]
        if (dailyTotals[id] !== undefined) {
            dailyTotals[id][0] += (player[id][0] + player[id][1])
            dailyTotals[id][1]++
            if (dailyTotals[id][0] > maxDailyGames) { maxDailyGames = dailyTotals[id][0] }
            if (dailyTotals[id][1] > maxDailyPlayers) { maxDailyPlayers = dailyTotals[id][1] }
        }
    })

    playerDailyActivityTotals.push(dayIds.length)
    playerTotalGames.push(wins + quits)

    playerResultsTable.innerHTML += `<tr class='${(zebra) ? 'highlight' : ''}'>
    <td class='user-id'>${id} <span class='geo-locate' data-ip='${id}'>⚑</span></td>
    <td class='start-date'>${(new Date(globalStats.playerResults.s + (dayIds[0] * 86400000))).toLocaleDateString()}</td>
    <td class='days'>${dayIds.length}</td>
    <td class='avg-played'>${Math.round((wins + quits) / dayIds.length)}</td>
    <td class='wins'>${wins}</td>
    <td class='quits'>${quits}</td>
</tr>`
    zebra = !zebra
}

playerResultsTable.addEventListener('click', async (e) => {
    if (Array.from(e.target.classList).includes('geo-locate')) {
        const data = await geoLocate(e.target.getAttribute('data-ip'))
        if (data.country !== '?') {
            e.target.innerHTML = `<img src='https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${data.country.toLowerCase()}.svg' style='width:1.3em;' title='${data.country_name}'>`
        } else {
            e.target.innerHTML = `(unk)`
        }
        e.target.classList.remove('geo-locate')
    }
})

async function geoLocate(ip) {
    const unknownData = { country: '?', country_name: '?', city: '?' }

    const resp = await fetch(`https://ipapi.co/${ip}/json/`)
    if (resp.status !== 200) {
        console.warn(resp.status, await resp.text())
        return unknownData
    }
    try {
        const data = await resp.json()
        return {
            country: data.country_code || '?',
            city: data.city || '?',
            country_name: data.country_name || '?'
        }
    } catch(err) {
        console.warn(err)
        return unknownData
    }
}



playerDailyActivityTotals.sort((a,b) => a-b)
playerTotalGames.sort((a,b) => a-b)
document.querySelector('.med-days').innerHTML = playerDailyActivityTotals[Math.ceil(playerDailyActivityTotals.length / 2)]
document.querySelector('.med-games').innerHTML = playerTotalGames[Math.ceil(playerTotalGames.length / 2)]


const chartMaxHeight = 100
const dailyChartDays = Object.keys(dailyTotals).map((k) => Number(k)).sort((a,b) => a-b)
const dailyGamesChartEl = document.querySelector('.daily-activity.games-played')
const dailyPlayersChartEl = document.querySelector('.daily-activity.active-players')
const gameBars = []
const playerBars = []
const labels = []

const gamesMultiplier = (maxDailyGames < (chartMaxHeight / 2)) ? 3 : ((maxDailyGames < chartMaxHeight) ? 2 : 1)
const gamesDivisor = (maxDailyGames > chartMaxHeight) ? maxDailyGames / chartMaxHeight : 1
const playersMultiplier = (maxDailyPlayers < (chartMaxHeight / 2)) ? 3 : ((maxDailyPlayers < chartMaxHeight) ? 2 : 1)
const playersDivisor = (maxDailyPlayers > chartMaxHeight) ? maxDailyPlayers / chartMaxHeight : 1

dailyChartDays.forEach((day) => {
    const date = (new Date(globalStats.playerResults.s + (day * 86400000))).toLocaleDateString()

    const gamesBarHeight = (dailyTotals[day][0] * gamesMultiplier) / gamesDivisor
    const playersBarHeight = (dailyTotals[day][1] * playersMultiplier) / playersDivisor
    
    gameBars.push(`<td title='${dailyTotals[day][0]} games played'><span class='stat-bar' style='height:${gamesBarHeight}px;'></span></td>`)
    playerBars.push(`<td title='${dailyTotals[day][1]} active players'><span class='stat-bar' style='height:${playersBarHeight}px;'></span></td>`)
    labels.push(`<td title='${date}'>${date.split('/').slice(0,2).join('/')}</td>`)
})

dailyGamesChartEl.querySelector('tbody tr').innerHTML += gameBars.join('')
dailyGamesChartEl.querySelector('tfoot tr').innerHTML += labels.join('')

dailyPlayersChartEl.querySelector('tbody tr').innerHTML += playerBars.join('')
dailyPlayersChartEl.querySelector('tfoot tr').innerHTML += labels.join('')
