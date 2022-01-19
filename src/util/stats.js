const DISABLE_STATS = process.env.DISABLE_STATS === 'true'
if (DISABLE_STATS) {
    console.warn('Statistics collection disabled')
} else {
    console.info('Collecting stats for this server')
}

const STATS_KEY = process.env.STATS_KEY || 'GUESSLE_STATS'

const getStats = async (cache) => {
    if (DISABLE_STATS) { return null }
    
    if (!cache) {
        console.warn('No cache client, unable to retrieve stats')
        return null
    }

    let stats = JSON.parse(await cache.getAsync(STATS_KEY))
    if (stats === null) {
        stats = await resetAllStats(cache)
    }
    return stats
}

const resetAllStats = async (cache) => {
    if (DISABLE_STATS) { return null }
    
    if (!cache) {
        console.warn('No cache client, unable to reset stats')
        return null
    }

    const stats = {
        startTime: Date.now(),
        gamesPlayed: 0,
        gamesWon: 0,
        gamesQuit: 0,
        guessAverage: 0
    }
    await cache.setAsync(STATS_KEY, JSON.stringify(stats))
    return stats
}

const addNewStat = async (cache, key, value=null) => {
    if (DISABLE_STATS) { return null }
    if (!key) { throw new Error('No key provided for the new stat item') }
    
    if (!cache) {
        console.warn('No cache client, unable to add new stat')
        return null
    }

    const stats = await getStats(cache)
    if (!stats) {
        throw new Error('Unable to get current stats object to add new item')
    }

    stats[key] = value
    await cache.setAsync(STATS_KEY, JSON.stringify(stats))

    return stats
}

const incrementStats = async (cache, keys) => {
    if (DISABLE_STATS) { return null }
    if (!Array.isArray(keys)) { throw new Error('No array of keys provided to increment stats') }
    
    if (!cache) {
        console.warn('No cache client, unable to increment stat')
        return null
    }

    const stats = await getStats(cache)
    if (!stats) {
        throw new Error('Unable to get current stats object to increment item')
    }

    const newValues = keys.map((key) => {
        if (!stats[key]) { stats[key] = 0 }
        if (!typeof(stats[key]) === 'number') {
            throw new Error(`Stat to increment is not a number (${key})`)
        }
        stats[key]++
        return { [key]: stats[key] }
    })
    
    await cache.setAsync(STATS_KEY, JSON.stringify(stats))

    return stats
}

const addValueToList = async (cache, key, value=null, unique=false) => {
    if (DISABLE_STATS) { return null }
    if (!key) { throw new Error('No key provided for the stat item to add to') }
    
    if (!cache) {
        console.warn('No cache client, unable to add new value to stat')
        return null
    }

    const stats = await getStats(cache)
    if (!stats) {
        throw new Error('Unable to get current stats object to add value to item')
    }

    if (!Array.isArray(stats[key])) {
        if (stats[key]) { throw new Error('That key already exists in the stats and is not an array, unable to add a value to it') }
        stats[key] = []
    }

    if (!unique || !stats[key].includes(value)) {
        stats[key].push(value)
    }
    await cache.setAsync(STATS_KEY, JSON.stringify(stats))

    return stats
}

module.exports = {
    resetAllStats,
    getStats,
    addNewStat,
    incrementStats,
    addValueToList
}
