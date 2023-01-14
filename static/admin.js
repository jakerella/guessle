
// ------------------ Check for dark mode -------------------- //
try {
    const options = JSON.parse(localStorage.getItem('guessle-options'))
    if (options && options.dark) { document.body.classList.add('dark-mode') }
} catch(e) { /* don't care... */ }


const currDay = Math.floor((Date.now() - globalStats.playerResults.s) / 86400000)
const dailyTotals = {}
let maxDaily = 0
for (let i=currDay; i>-1 && i>(currDay-30); --i) { dailyTotals[i] = 0; }

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
            dailyTotals[id] += (player[id][0] + player[id][1])
        }
        if (dailyTotals[id] > maxDaily) { maxDaily = dailyTotals[id] }
    })

    playerDailyActivityTotals.push(dayIds.length)
    playerTotalGames.push(wins + quits)

    playerResultsTable.innerHTML += `<tr class='${(zebra) ? 'highlight' : ''}'>
    <td class='user-id'>${id}</td>
    <td class='start-date'>${(new Date(globalStats.playerResults.s + (dayIds[0] * 86400000))).toLocaleDateString()}</td>
    <td class='days'>${dayIds.length}</td>
    <td class='avg-played'>${Math.round((wins + quits) / dayIds.length)}</td>
    <td class='wins'>${wins}</td>
    <td class='quits'>${quits}</td>
</tr>`
    zebra = !zebra
}


playerDailyActivityTotals.sort((a,b) => a-b)
playerTotalGames.sort((a,b) => a-b)
document.querySelector('.med-days').innerHTML = playerDailyActivityTotals[Math.ceil(playerDailyActivityTotals.length / 2)]
document.querySelector('.med-games').innerHTML = playerTotalGames[Math.ceil(playerTotalGames.length / 2)]


const chartMax = 100
const dailyChartDays = Object.keys(dailyTotals).sort()
const chartEl = document.querySelector('.global-chart.stat-chart')
const bars = []
const labels = []

const multiplier = (maxDaily < (chartMax / 2)) ? 3 : ((maxDaily < chartMax) ? 2 : 1)
const divisor = (maxDaily > chartMax) ? maxDaily / chartMax : 1

for (let day in dailyChartDays) {
    let height = (dailyTotals[day] * multiplier) / divisor
    
    const date = (new Date(globalStats.playerResults.s + (day * 86400000))).toLocaleDateString()
    
    bars.push(`<td class='day-${day}'><span class='stat-bar' style='height:${height}px;'></span></td>`)
    labels.push(`<td title='${date}'>${date.split('/').slice(0,2).join('/')}</td>`)
}

chartEl.querySelector('tbody tr').innerHTML += bars.join('')
chartEl.querySelector('tfoot tr').innerHTML += labels.join('')
