const prompts = require("prompts");
const chalk = require("chalk");
const wordleUtils = require("./utils/wordleUtils.js");
const words = require("./utils/words");
const { colorWord } = require("./utils/wordleUtils");

console.log(
  chalk.bold.green("Command ") +
    chalk.bold.yellow("Line ") +
    chalk.bold.green("Wordle") +
    "\n"
);

const initPrompt = {
  type: "select",
  name: "value",
  message: "Select a mode",
  choices: [
    {
      title: "Play",
      description: "Play Wordle in command line",
      value: "play",
    },
    {
      title: "Solve",
      description: "Solve a Wordle puzzle",
      value: "solve",
    },
    {
      title: "Benchmark",
      description: "Benchmark the solver algorithm",
      value: "benchmark",
    },
    {
      title: "Exit",
      value: "exit",
    },
  ],
  initial: 0,
};

const playPromptWithAttempts = (attempts) => {
  return {
    type: "text",
    name: "word",
    message: `(${attempts}/6) Enter a 5 letter word:`,
    validate: (value) =>
      words.getAllWords().includes(value.toLowerCase())
        ? true
        : "Must be a valid 5 letter word",
  };
};

const solverPrompt = {
  type: "text",
  name: "status",
  message: `Enter guess results:`,
  validate: (value) =>
    wordleUtils.parseGuess(value).length === 5
      ? true
      : "Badly formatted guess.",
};

async function solver() {
  let wordsLeft = true;

  console.log(
    "- Use ? after a letter to indicate a yellow letter (e.g. F?)\n- Use ! after a letter to indicate a gray letter (e.g. V!)\n- Any other character will be considered a green letter.\nExamples of valid inputs: SL!A?T!E? or C!RON!Y!\n"
  );

  while (wordsLeft) {
    const response = await prompts(solverPrompt);

    if (response.status !== undefined) {
      const status = wordleUtils.parseGuess(response.status);
      const gameStatus = wordleUtils.generateGameStatus(status);
      const words = wordleUtils.getPossibleWords(gameStatus);

      if (words !== undefined) {
        console.log(
          `${chalk.italic("Last guess:")} ${colorWord(
            response.status.toUpperCase()
          )}`
        );
        console.log(
          `${chalk.italic("Next guess:")} ${chalk.bold(
            words[0][0].toUpperCase()
          )}`
        );
        if (words.length === 1) {
          wordsLeft = false;
          console.log("\nNo other words are left.\n");
        }
      } else {
        wordsLeft = false;
        console.log(
          "Something went wrong. There are no words left in the wordlist. Check for possible mistakes in your inputs.\n"
        );
      }
    } else {
      process.exit();
    }
  }
  wordleUtils.resetLetters();
  await main();
}

async function playGame() {
  const word =
    words.getTargetList()[
      Math.floor(Math.random() * words.getTargetList().length)
    ];
  let attempts = 1;
  const blocks = [];
  let solved = false;
  const usedChars = new Set();

  while (attempts <= 6 && !solved) {
    const response = await prompts(playPromptWithAttempts(attempts));

    if (response.word !== undefined) {
      const status = wordleUtils.getGuessResults(
        word,
        response.word.toLowerCase()
      );
      blocks.push(wordleUtils.emojify(status));

      if (response.word.toLowerCase() === word) {
        console.log(
          `Congratulations 🎉! ${chalk.bold.green(
            word.toUpperCase()
          )} was the word.\n`
        );
        blocks.map((line) => console.log(line));
        console.log("\n");
        solved = true;
      } else {
        response.word
          .toLowerCase()
          .split("")
          .forEach((char) => {
            usedChars.add(char);
          });
        console.log(wordleUtils.colorWord(status) + "\n");
        console.log(wordleUtils.colorAlphabet(usedChars));
        attempts++;
      }
    } else {
      process.exit();
    }
  }

  if (attempts > 6) {
    console.log(
      `You lost 😿. The correct word was ${chalk.bold.underline(
        word.toUpperCase()
      )}.\n`
    );
  }
  await main();
}

async function benchmark() {
  const wordsToSolve = words.getTargetList();

  const games = [];

  console.log(`Using ${chalk.bold("SALET")} as a starting guess.\n`);

  for (const targetWord of wordsToSolve) {
    let attempts = 1;
    let solved = false;
    let guess = "salet";

    while (attempts <= 6 && !solved) {
      const status = wordleUtils.parseGuess(
        wordleUtils.getGuessResults(targetWord, guess)
      );
      const gameStatus = wordleUtils.generateGameStatus(status);
      const words = wordleUtils.getPossibleWords(gameStatus);
      guess = words[0][0];

      attempts++;

      if (guess === targetWord) {
        solved = true;
      }
    }

    games.push({
      word: targetWord,
      attempts,
    });
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
      `Solved ${chalk.bold(
        targetWord.toUpperCase()
      )} in ${attempts} attempts. (${games.length}/${wordsToSolve.length})`
    );
    wordleUtils.resetLetters();
  }

  const averageNumberOfAttempts =
    games.reduce((acc, game) => acc + game.attempts, 0) / games.length;

  console.log(
    `\nAverage number of attempts to solve a Wordle game: ${chalk.bold(
      averageNumberOfAttempts
    )}\n`
  );
  console.log(
    `Failed to solve the following words in 6 attempts or less: \n${chalk.bold(
      games
        .filter((game) => game.attempts > 6)
        .map((game) => game.word.toUpperCase())
        .join(", ")
    )}`
  );
}

async function main() {
  const response = await prompts(initPrompt);

  if (response.value === "play") {
    await playGame();
  } else if (response.value === "solve") {
    await solver();
  } else if (response.value === "benchmark") {
    await benchmark();
  } else if (response.value === "exit") {
    console.log("Exiting.");
    process.exit();
  }
}

main();
