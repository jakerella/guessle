const DISABLE_STATS = process.env.DISABLE_STATS === 'true'
if (DISABLE_STATS) {
    console.warn('Statistics collection disabled')
} else {
    console.info('Collecting stats for this server')
}

const PLAYER_RESULTS_KEY = process.env.PLAYER_RESULTS_KEY || 'playerResults'
const GUESS_FREQ_KEY = process.env.GUESS_FREQ_KEY || 'guessFreq'

/**
structure of player results: {
    "s": ts,  // start timestamp of results collection
    ip: {  // unique player ID (defaults to IP on front end currently)
        dayNum: [ wins, quits ]  // map keyed by days since start to get frequency stats
    },
    ...  // one entry per player (supercedes previous stat collection mechanism)
}
structure of guess frequency: {
    guessAmt: count,
    ...
}
*/


/**
 // These are the old cache keys and structure:
 {
   startTime: 1673535391227,
   gamesPlayed: 23,
   gamesWon: 20,
   gamesQuit: 3,
   players: ['1.2.3.4', '2.3.4.5'],
   guessCounts: [2,6,3,9,3,5,3,5],
   guessAverage: 3.7
 }
 */
 const OLD_STATS_KEY = process.env.STATS_KEY || 'GUESSLE_STATS'
 const OLD_PLAYERS_KEY = 'players'
 const OLD_GUESS_COUNTS_KEY = 'guessCounts'



const getStats = async (cache, key) => {
    if (DISABLE_STATS) { return null }
    
    if (!cache) {
        console.warn('No cache client, unable to retrieve stats')
        return null
    }

    if (key) {
        return JSON.parse(await cache.getAsync(key))
    } else {

        const playerResults = JSON.parse(await cache.getAsync(PLAYER_RESULTS_KEY))
        const guessFreq = JSON.parse(await cache.getAsync(GUESS_FREQ_KEY))
        if (playerResults === null && guessFreq === null) {
            await resetAllStats(cache)
        }

        let gamesWon = 0
        let gamesQuit = 0

        for (id in playerResults) {
            if (id !== 's') {
                for (d in playerResults[id]) {
                    gamesWon += playerResults[id][d][0]
                    gamesQuit += playerResults[id][d][1]
                }
            }
        }

        let totalGames = 0
        let totalGuesses = 0

        // Combine old-style stats with new style for counts and averages
        const oldStats = JSON.parse(await cache.getAsync(OLD_STATS_KEY))
        const oldPlayerList = JSON.parse(await cache.getAsync(OLD_PLAYERS_KEY))
        const oldGuessCounts = JSON.parse(await cache.getAsync(OLD_GUESS_COUNTS_KEY))
        if (oldStats) {
            gamesWon += oldStats.gamesWon
            gamesQuit += oldStats.gamesQuit
        }
        if (oldGuessCounts) {
            totalGames += oldStats.gamesPlayed
            totalGuesses += oldGuessCounts.reduce((t, v) => t+v, 0)
        }
        const oldPlayerCount = (oldPlayerList) ? oldPlayerList.length : 0


        const guessCounts = [].concat(oldGuessCounts)
        for (guessAmt in guessFreq) {
            totalGuesses += (Number(guessAmt) * guessFreq[guessAmt])
            totalGames += guessFreq[guessAmt]

            for (let i=0; i<guessFreq[guessAmt]; ++i) {
                guessCounts.push(Number(guessAmt))
            }
        }
        const guessAverage = (totalGames) ? Math.round((totalGuesses / totalGames) * 10) / 10 : 0

        const stats = {
            startTime: (oldStats) ? oldStats.startTime : playerResults.s,
            gamesWon,
            gamesQuit,
            playerCount: Object.keys(playerResults).length - 1 + oldPlayerCount,
            guessFreq,
            guessCounts,
            guessAverage,
            playerResults
        }

        return stats
    }
}


const addPlayerResult = async (cache, playerId, result, day = 0) => {
    if (DISABLE_STATS) { return null }

    if (!cache) {
        console.warn('No cache client, unable to increment stat')
        return null
    }

    if (process.env.NODE_ENV === 'development') {
        console.debug(`Adding player result: ${playerId} had a result of ${result} on day ${day}`)
    }

    let playerResults = JSON.parse(await cache.getAsync(PLAYER_RESULTS_KEY))
    if (playerResults === null) { playerResults = {s:Date.now()} }

    if (!playerResults[playerId]) { playerResults[playerId] = {} }

    const dayCount = day || Math.floor((Date.now() - playerResults.s) / 86400000)

    if (!playerResults[playerId][dayCount]) { playerResults[playerId][dayCount] = [0,0] }
    
    result = Number(result) || 0
    const resultIndex = (result > 0) ? 0 : 1  // win vs loss
    playerResults[playerId][dayCount][resultIndex] += 1

    await cache.setAsync(PLAYER_RESULTS_KEY, JSON.stringify(playerResults))

    if (result > 0) {
        try {
            let guessCounts = JSON.parse(await cache.getAsync(GUESS_FREQ_KEY))
            if (!guessCounts) { guessCounts = {} }
            if (!guessCounts[result]) { guessCounts[result] = 0 }
            guessCounts[result] += 1
            console.debug('Setting you guess counts:', guessCounts)
            await cache.setAsync(GUESS_FREQ_KEY, JSON.stringify(guessCounts))

        } catch(err) {
            console.debug('Unable to add guess count to frequency stats during player result:', err.message)
            // We don't want to fail the original addition... yes, our stats may be off, but I think this is better
        }
    }
}


const setStatsStart = async (cache, timestamp) => {
    if (DISABLE_STATS) { return null }
    
    if (!cache) {
        console.warn('No cache client, unable to reset stats')
        return null
    }

    if (!Number(timestamp)) {
        throw new Error('Invalid timestamp provided to reset stats start time')
    }

    let playerResults = JSON.parse(await cache.getAsync(PLAYER_RESULTS_KEY))
    if (playerResults === null) { playerResults = { s: Date.now() } }
    playerResults.s = timestamp

    await cache.setAsync(PLAYER_RESULTS_KEY, JSON.stringify(playerResults))
}


const resetAllStats = async (cache) => {
    if (DISABLE_STATS) { return null }
    
    if (!cache) {
        console.warn('No cache client, unable to reset stats')
        return null
    }

    await cache.setAsync(GUESS_FREQ_KEY, '{}')
    await cache.setAsync(PLAYER_RESULTS_KEY, `{"s": ${Date.now()}}`)
}


module.exports = {
    resetAllStats,
    setStatsStart,
    getStats,
    addPlayerResult
}
