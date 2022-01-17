const { promisify } = require('util')
const redis = require('redis')

const DISABLE_STATS = process.env.DISABLE_STATS === 'true'
if (DISABLE_STATS) {
    console.warn('Statistics collection disabled')
} else {
    console.info('Collecting stats for this server')
}

const STATS_KEY = process.env.STATS_KEY || 'GUESSLE_STATS'
let _client = null

const cacheClient = () => {
    if (_client) { return _client }
    
    if (!process.env.REDIS_URL) {
        console.warn('WARNING: No Redis URL provided, caching will not occur.')
        return null
    }

    _client = redis.createClient(process.env.REDIS_URL)

    _client.getAsync = promisify(_client.get).bind(_client)
    _client.delAsync = promisify(_client.del).bind(_client)
    _client.setAsync = promisify(_client.set).bind(_client)
    _client.setexAsync = promisify(_client.setex).bind(_client)

    _client.on('error', function(err) {
        console.error('ERROR from Redis:', err.message)
    })

    _client.on('end', function(err) {
        if (err) {
            console.info('Client connection to redis server closed with error:', err.message)
        }
        _client = null
    })

    return _client
}

const getStats = async () => {
    if (DISABLE_STATS) { return null }
    
    const cache = cacheClient()
    if (!cache) {
        console.warn('No cache client, unable to retrieve stats')
        return null
    }

    let stats = JSON.parse(await cache.getAsync(STATS_KEY))
    if (stats === null) {
        stats = await resetAllStats()
    }
    return stats
}

const resetAllStats = async () => {
    if (DISABLE_STATS) { return null }
    
    const cache = cacheClient()
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

const addNewStat = async (key, value=null) => {
    if (DISABLE_STATS) { return null }
    if (!key) { throw new Error('No key provided for the new stat item') }
    
    const cache = cacheClient()
    if (!cache) {
        console.warn('No cache client, unable to add new stat')
        return null
    }

    const stats = await getStats()
    if (!stats) {
        throw new Error('Unable to get current stats object to add new item')
    }

    stats[key] = value
    await cache.setAsync(STATS_KEY, JSON.stringify(stats))

    return stats
}

const incrementStats = async (keys) => {
    if (DISABLE_STATS) { return null }
    if (!Array.isArray(keys)) { throw new Error('No array of keys provided to increment stats') }
    
    const cache = cacheClient()
    if (!cache) {
        console.warn('No cache client, unable to increment stat')
        return null
    }

    const stats = await getStats()
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

const addValueToList = async (key, value=null, unique=false) => {
    if (DISABLE_STATS) { return null }
    if (!key) { throw new Error('No key provided for the stat item to add to') }
    
    const cache = cacheClient()
    if (!cache) {
        console.warn('No cache client, unable to add new value to stat')
        return null
    }

    const stats = await getStats()
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
