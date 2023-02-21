const chalk = require("chalk");
const words = require("./words");

let yellowLetters = [];
let incorrectLetters = [];
const letters = "abcdefghijklmnopqrstuvwxyz";

const removeGreenLetters = (word, guess) => {
  return word
    .split("")
    .filter((el, i) => el !== guess.charAt(i))
    .join("");
};

const removeLetters = (input, letters) => {
  return input
    .split("")
    .filter((e) => !letters.includes(e))
    .join("");
};

const parseGuess = (guess) => {
  const re = /([A-Za-z][!?]|[A-Za-z])/;
  return guess.split(re).filter((el) => el !== "");
};

const generateGameStatus = (userInput) => {
  let correct = "";
  let yellow = "";
  let incorrect = "";

  for (let i = 0; i < userInput.length; i++) {
    if (userInput[i].includes("?")) {
      yellow += userInput[i][0].toLowerCase();
    } else {
      yellow += "_";
    }

    if (
      userInput[i].includes("!") &&
      userInput.filter((el) => el.includes("?") && el[0] === userInput[i][0])
        .length === 0
    ) {
      incorrect += userInput[i][0].toLowerCase();
    }

    if (userInput[i].length === 1) {
      correct += userInput[i].toLowerCase();
    } else {
      correct += "_";
    }
  }
  return [correct, yellow, incorrect];
};

const average = (arr) => arr.reduce((p, c) => p + c, 0) / arr.length;

const rankWords = (words) => {
  const scores = [];
  for (const guess of words) {
    const advantage = [];
    for (const word of words) {
      if (guess !== word) {
        const result = getGuessResults(word, guess);
        const status = parseGuess(result);
        advantage.push(
          status.filter((el) => el.length === 1).length +
            status.filter((el) => el.includes("?")).length * 0.5
        );
      }
    }
    scores.push([guess, average(advantage)]);
  }
  scores.sort((a, b) => b[1] - a[1]);

  return scores;
};

const getPossibleWords = (gameStatus) => {
  gameStatus[1].split("").map((char, i) => {
    if (char !== "_") {
      if (!yellowLetters.includes(char)) {
        yellowLetters.push([char, i]);
      }
    }
  });

  gameStatus[2].split("").map((char) => {
    if (char !== "_") {
      incorrectLetters.push(char);
    }
  });

  const regexPattern = regexLetters(
    gameStatus[0],
    yellowLetters,
    incorrectLetters
  );

  let resultingWords = words
    .getTargetList()
    .filter((word) => word.match(RegExp(regexPattern)));
  for (let character of gameStatus[1].split("")) {
    if (character !== "_") {
      resultingWords = resultingWords.filter((word) =>
        word.includes(character)
      );
    }
  }

  const guesses = rankWords(resultingWords);

  if (resultingWords.length === 0) {
    resetLetters();
  } else {
    return guesses;
  }
};

const regexLetters = (gameStatus, yellowLetters, incorrectLetters) => {
  const possibleLetters = removeLetters(letters, incorrectLetters);

  let rePattern = "";

  gameStatus.split("").map((char, i) => {
    switch (char) {
      case "_":
        rePattern += `[${removeLetters(
          possibleLetters,
          yellowLetters.filter((el) => el[1] === i).map((el) => el[0])
        )}]`;
        break;
      default:
        rePattern += char;
        break;
    }
  });

  return rePattern;
};

const getGuessResults = (word, guess) => {
  let status = "";

  for (let i = 0; i < word.length; i++) {
    if (!word.includes(guess.charAt(i))) {
      status += guess.charAt(i) + "!";
    } else if (word.charAt(i) === guess.charAt(i)) {
      status += guess.charAt(i);
    } else {
      status +=
        removeGreenLetters(word, guess).includes(guess.charAt(i)) &&
        status.split("").filter((el) => el === guess.charAt(i)).length <
          word.split("").filter((el) => el === guess.charAt(i)).length
          ? `${guess.charAt(i)}?`
          : `${guess.charAt(i)}!`;
    }
  }
  return status;
};

const emojify = (statusArray) => {
  return parseGuess(statusArray)
    .map((el) => {
      if (el.length === 1) return "🟩";
      return el.includes("!") ? "⬜️" : "🟧";
    })
    .join("");
};

const colorWord = (statusArray) => {
  return parseGuess(statusArray)
    .map((el) => {
      if (el.length === 1) {
        return chalk.bold.green(`${el[0].toUpperCase()}`);
      } else if (el.includes("!")) {
        return chalk.bold.gray(`${el[0].toUpperCase()}`);
      } else {
        return chalk.bold.yellow(`${el[0].toUpperCase()}`);
      }
    })
    .join("");
};

const colorAlphabet = (usedChars) => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";

  return alphabet
    .split("")
    .map((char) =>
      usedChars.has(char)
        ? chalk.bold.gray(char.toUpperCase())
        : chalk.bold.white(char.toUpperCase())
    )
    .join("");
};

const resetLetters = () => {
  yellowLetters = [];
  incorrectLetters = [];
};

module.exports = {
  getGuessResults,
  generateGameStatus,
  getPossibleWords,
  parseGuess,
  colorWord,
  resetLetters,
  emojify,
  colorAlphabet,
};
