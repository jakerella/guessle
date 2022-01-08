const fs = require('fs')

const wordLength = 6

const scrabble = require(`./scrabble_${wordLength}.json`)
let lists = {
    wordfrequencyinfo: fs.readFileSync(`./freq_wordfrequency-info_${wordLength}.txt`).toString().split(/\n/),
    martinweisser: fs.readFileSync(`./freq_martinweisser_${wordLength}.txt`).toString().split(/\n/),
    norvigngrams: fs.readFileSync(`./freq_norvig-ngrams_${wordLength}.txt`).toString().split(/\n/)
}

for (source in lists) {
    console.log(`Filtering ${source} for Scrabble words... (started with ${lists[source].length})`)
    lists[source] = lists[source].filter((w) => scrabble.includes(w))
    console.log(`${source} now has ${lists[source].length}`)
}

let frequent = []

console.log(`Consolidating martinweisser into wordfreqency.info...`)
frequent = mergeLists([...lists.wordfrequencyinfo], lists.martinweisser)
console.log(`Base frequent list now has ${frequent.length} words`)

console.log(`Consolidating norvig into frequent base...`)
frequent = mergeLists([...frequent], lists.norvigngrams)
console.log(`Base frequent list now has ${frequent.length} words`)

fs.writeFileSync(`./frequent_${wordLength}.json`, JSON.stringify(frequent, null, 2))

function mergeLists(base, addition) {
    let counter = 0
    addition.forEach((w, i) => {
        if (!base.includes(w)) {
            counter++
            if (i > base.length - 2) {
                base.push(w)
            } else {
                base.splice(i+1, 0, w)
            }
        }
    })
    console.log(`Added ${counter} words to base list`)
    return base
}

