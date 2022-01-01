const AppError = require('../util/AppError')
const dict = require('../util/words_5.json')

const check = {
    'NOPE': 0,
    'SORTA': 1,
    'YAS': 2
}

module.exports = {
    generateGame() {
        return {
            word: dict[Math.floor(Math.random() * 5000)],
            guesses: []
        }
    },

    makeGuess(game, word) {
        if (!dict.includes(word)) {
            throw new AppError('Sorry, but I don\'t know that word.', 400)
        }
        const prevGuess = game.guesses.map((guess) => guess.map((g) => g.letter).join('')).filter((g) => g === word)
        if (prevGuess.length) {
            throw new AppError('You already guessed that word!', 400)
        }

        const guess = []
        const stats = {}
        for (let i=0; i<game.word.length; ++i) {
            if (!stats[game.word[i]]) {
                stats[game.word[i]] = { count: 0, y: 0, n: 0, s: 0 }
            }
            stats[game.word[i]].count++
            
            if (word[i] === game.word[i]) {
                guess.push({ letter: word[i], check: check.YAS })
                stats[game.word[i]].y++
            } else if (game.word.includes(word[i])) {
                guess.push({ letter: word[i], check: check.SORTA })
                stats[game.word[i]].s++
            } else {
                guess.push({ letter: word[i], check: check.NOPE })
                stats[game.word[i]].n++
            }
        }

        // Check the sorta's, might have some dupes in here with correct guesses (so they're false-sortas)
        const sortas = guess.filter((gl) => gl.check === check.SORTA)
        sortas.forEach((sorta) => {
            if (stats[sorta.letter].count === stats[sorta.letter].y) {
                // this is no sorta... user already found all these letters
                sorta.check = check.NOPE
            }
        })

        return guess
    },

    isGameSolved(game) {
        const lastGuess = game.guesses[game.guesses.length-1].map((g) => g.letter).join('')
        return lastGuess === game.word
    }
}
