const AppError = require('../util/AppError')
const dict = {
    5: require('../../lists/scrabble_5.json'),
    6: require('../../lists/scrabble_6.json')
}
const frequent = {
    5: require('../../lists/frequent_5.json'),
    6: require('../../lists/frequent_6.json')
}

const CHECK_TYPES = {
    'NOPE': 0,
    'SORTA': 1,
    'YAS': 2
}

const DIFFICULTY_DEPTHS = {
    1: 3,
    2: 2,
    3: 1
}

module.exports = {
    generateGame(options) {
        const wordLength = (options.wordLength && dict[options.wordLength]) ? options.wordLength : 5
        options.depth = (Number(options.depth)) ? Number(options.depth) : 2
        
        const wordDepth = (DIFFICULTY_DEPTHS[options.depth]) ? frequent[wordLength].length / DIFFICULTY_DEPTHS[options.depth] : frequent[wordLength].length / 2

        options.dupeLetters = (typeof(options.dupeLetters) === 'boolean') ? options.dupeLetters : true

        if (process.env.NODE_ENV === 'development') {
            console.log(`finding new ${wordLength}-letter word with depth ${options.depth} (top ${wordDepth} of ${frequent[wordLength].length} words); dupes? ${options.dupeLetters}`)
        }

        let word = findWord({ wordLength, wordDepth, dupes: options.dupeLetters })

        return {
            word,
            guesses: []
        }
    },

    makeGuess(game, guessWord) {
        if (!dict[game.word.length].includes(guessWord)) {
            throw new AppError('Sorry, but I don\'t know that word.', 400)
        }
        const prevGuessMatch = game.guesses.map((gameGuess) => gameGuess.map((g) => g.letter).join('')).filter((g) => g === guessWord)
        if (prevGuessMatch.length) {
            throw new AppError('You already guessed that word!', 400)
        }

        const guess = []
        for (let i=0; i<game.word.length; ++i) {
            if (guessWord[i] === game.word[i]) {
                guess.push({ letter: guessWord[i], check: CHECK_TYPES.YAS })
            } else if (game.word.includes(guessWord[i])) {
                guess.push({ letter: guessWord[i], check: CHECK_TYPES.SORTA })
            } else {
                guess.push({ letter: guessWord[i], check: CHECK_TYPES.NOPE })
            }
        }

        // Check the sorta's, might have some dupes in here with correct guesses (so they're false-sortas)
        // Start with the green ("yas") letters for the counts
        const letterCounts = {}
        guess
            .filter((gl) => gl.check === CHECK_TYPES.YAS)
            .forEach((gl) => {
                letterCounts[gl.letter] = (letterCounts[gl.letter]) ? ++letterCounts[gl.letter] : 1
            })
        guess
            // grab all the "sortas"
            .filter((gl) => gl.check === CHECK_TYPES.SORTA)
            .forEach((sorta) => {
                const answerLetterCount = game.word.match(new RegExp(sorta.letter, 'g')).length
                // Add the sortas to the "correct" answer count...
                letterCounts[sorta.letter] = (letterCounts[sorta.letter]) ? ++letterCounts[sorta.letter] : 1
                // And determine if we have too many "sortas" for the given letter
                if (answerLetterCount < letterCounts[sorta.letter]) {
                    sorta.check = CHECK_TYPES.NOPE
                    letterCounts[sorta.letter]--
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
    const word = frequent[options.wordLength][Math.floor(Math.random() * options.wordDepth)]
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
