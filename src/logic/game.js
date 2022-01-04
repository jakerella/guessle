const AppError = require('../util/AppError')
const dict = require('../../lists/scrabble_5.json')
const frequent = require('../../lists/frequent_5.json')

const check = {
    'NOPE': 0,
    'SORTA': 1,
    'YAS': 2
}

const DIFFICULTY_DEPTHS = {
    1: frequent.length / 3,
    2: frequent.length / 2,
    3: frequent.length
}

module.exports = {
    generateGame(options) {
        options.depth = (Number(options.depth)) ? Number(options.depth) : 2
        const wordDepth = (DIFFICULTY_DEPTHS[options.depth]) ? DIFFICULTY_DEPTHS[options.depth] : DIFFICULTY_DEPTHS[2]

        options.dupeLetters = (typeof(options.dupeLetters) === 'boolean') ? options.dupeLetters : true

        if (process.env.NODE_ENV === 'development') {
            console.log(`finding word with depth ${options.depth} (top ${wordDepth} of ${frequent.length} words); dupes? ${options.dupeLetters}`)
        }

        let word = findWord({ depth: wordDepth, dupes: options.dupeLetters })

        return {
            word,
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

function findWord(options, count=0) {
    const word = frequent[Math.floor(Math.random() * options.depth)]
    if (!options.dupes && !/^(?!.*(.).*\1)[a-z]+$/.test(word)) {
        if (count > 100) {
            console.warn('Unable to find word with no dupe letters in first 100 tries')
            return word
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.log(`Skipping word with dupe letters: ${word}`)
            }
            return findWord(options, ++count)
        }
    }
    return word
}
