const fetch = require('node-fetch')
const fs = require('fs')

;(async () => {
    const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']
    const dict = []
    const wordLength = 6

    console.log('Retrieving letters')
    await Promise.all(letters.map(async (letter) => {
        const resp = await fetch(`https://scrabble.merriam.com/lapi/1/sbl_finder/get_limited_data?mode=wfd&type=begins&rack=${letter}&len=${wordLength}`)
        if (resp.status !== 200) {
            throw new Error(`Bad response from merriam site: ${resp.status}:\n${await resp.text()}`)
        }
        const words = (await resp.json()).data
        console.log(`  ...there are ${words.length} ${wordLength}-letter words starting with "${letter}"`)
        dict.push(...words)
    }))
    dict.sort()
    console.log(`Complete. There are a total of ${dict.length} ${wordLength}-letter words in the Scrabble dictionary.`)
    fs.writeFileSync(`scrabble_${wordLength}.json`, JSON.stringify(dict, null, 2))
})();

