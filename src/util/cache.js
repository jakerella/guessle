const { promisify } = require('util')
const redis = require('redis')


const getClient = (url) => {
    if (!url) {
        console.warn('WARNING: No Redis URL provided, cannot create cache client.')
        return null
    }

    if (process.env.NODE_ENV === 'development') {
        console.log('Getting new redis client...')
    }

    let client = redis.createClient(url)

    client.getAsync = promisify(client.get).bind(client)
    client.delAsync = promisify(client.del).bind(client)
    client.setAsync = promisify(client.set).bind(client)
    client.quitAsync = promisify(client.quit).bind(client)

    client.on('connect', () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('...connection to redis created.')
        }
    })

    client.on('error', async function(err) {
        if (process.env.NODE_ENV === 'development') {
            console.error('ERROR from Redis:', err)
        } else {
            console.error('ERROR from Redis:', err.message)
        }
        await client.quitAsync()
        client = null
    })

    client.on('end', async function(err) {
        if (err) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Client connection to redis server closed with error:', err)
            } else {
                console.info('Client connection to redis server closed with error:', err.message)
            }
        } else if (process.env.NODE_ENV === 'development') {
            console.log('Redis connection closed.')
        }
        await client.quitAsync()
        client = null
    })

    return client
}

module.exports = { getClient }
