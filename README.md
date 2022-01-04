# Guessle

This is a [Wordle](https://www.powerlanguage.co.uk/wordle/) Clone with a few extra features. It's essentially the same rules, but you can play more than once a day. The game uses the [Official Scrabble dictionary](https://scrabble.merriam.com) as both the selection of "solution" words, and to check guesses.

## Playing the Game

Head over to [guessle.herokuapp.com](https://guessle.herokuapp.com) to play. No account needed, nothing to set up.

The object of the game is to guess the word. You do this by getting  clues each time you guess. If you see a letter in gray, then that letter does not appear in the final solution. If you see a letter in yellow, it appears in the solution, but not where you have have guessed. And if you see a letter in green, you have that one in the correct position!

You can either use the in-game virtual keyboard to type or you can use an actual keyboard. The in-game virtual keyboard also shows you letters you have guessed already, and their result. Once you have all of the letters guessed, you win! You can always give up on that word and ask for a new one. And once you win, you can ask for a new word. (You will also see a link to the definition of the solved word in case you want to learn about it!)

Note that some words have more than 1 of the same letter (for example, "brood"). In this case, you may get a green or yellow indicator when you use one of those letters, but there may be a duplicate! If you guess a word with two letters, you might get one green and one yellow! (A gray letter _always_ means it does not appear at all in the solution.)

## Running the Code

Want to spin up a version of this game yourself? No problem. There is no database, user management, or other persistence outside of the source code and the dictionary file. Make sure you [download and install Node.js](https://nodejs.org) and then start the server from the root directory using `npm start`


## Odds and Ends

### Wordle is great, why did you remake it?

That's a fair question. I like the game, but I didn't like only being able to play once a day, so I made this. I'm a software engineer by trade, and I like to tinker. I also can now add in options that I like!

### Is this free?

Yep, free to all. The code is open sourced here. Feel free to run your own version and change it all up if you want.

### What license is the code under?

This code is under an [MIT license](/LICENSE). Feel free to use it as you like.
