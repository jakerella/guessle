# Guessle

This is a [Wordle](https://www.powerlanguage.co.uk/wordle/) Clone with a few extra features. It's essentially the same rules, but you can play more than once a day. The game uses the [Official Scrabble dictionary](https://scrabble.merriam.com) as both the selection of "solution" words, and to check guesses.


## Playing the Game

Head over to [guessle.herokuapp.com](https://guessle.herokuapp.com) to play. No account needed, nothing to set up.

The object of the game is to guess the word. You do this by getting  clues each time you guess. If you see a letter in gray, then that letter does not appear in the final solution. If you see a letter in yellow, it appears in the solution, but not where you have have guessed. And if you see a letter in green, you have that one in the correct position!

You can either use the in-game virtual keyboard to type or you can use an actual keyboard. The in-game virtual keyboard also shows you letters you have guessed already, and their result. Once you have all of the letters guessed, you win! You can always give up on that word and ask for a new one. And once you win, you can ask for a new word. (You will also see a link to the definition of the solved word in case you want to learn about it!)

Note that some words have more than 1 of the same letter (for example, "brood"). In this case, you may get a green or yellow indicator when you use one of those letters, but there may be a duplicate! If you guess a word with two letters, you might get one green and one yellow! (A gray letter _always_ means it does not appear at all in the solution.)

### Where do the words come from?

The dictionary used for the game is the set of all 5-letter words from the Official Scrabble dictionary ([https://scrabble.merriam.com](https://scrabble.merriam.com)) posted online. They were retrieved in January 2022, so any updates since then are not included. **All solution words come from this dictionary.** Additionally, all guesses _must match a word in the Scrabble dictionary_.

That said, to make things a bit easier for people, the words chosen for the game come from a list of frequent words in the English language. There are many frequent-word lists out there, and none perfectly matched what I wanted, so I compiled three of them, de-duplicated them, and merged them for one master list of frequent 5-letter words. (The sites are listed below.) This also allows users to increase or decrease the difficulty of the game by choosing how "deep" in the frequent-word list to go (deeper == more difficult).

Frequent-word list sources:

* https://www.wordfrequency.info/
* http://norvig.com/ngrams/
* https://martinweisser.org/corpora_site/word_lists.html


## Running the Code

Want to spin up a version of this game yourself? No problem. There is no database, user management, or other persistence outside of the source code and the dictionary file. Make sure you [download and install Node.js](https://nodejs.org) and then start the server from the root directory using `npm start`

Note that you will need to set some environment variables to get things working properly. You can see those variables in the `.env.example` file. For local development you should create a new file called `.env` and copy the contents of the `.env.example` file into it. Then change the values to match your own.


## Odds and Ends

### Wordle is great, why did you remake it?

That's a fair question. I like the game, but I didn't like only being able to play once a day, so I made this. I'm a software engineer by trade, and I like to tinker. I also can now add in options that I like!

### Is this free?

Yep, free to all. The code is open sourced here. Feel free to run your own version and change it all up if you want.

### What license is the code under?

This code is under an [MIT license](/LICENSE). Feel free to use it as you like.
