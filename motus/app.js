const express = require('express')
const fs = require('fs');
const path = require('path');
const app = express()
const port = 3000

const wordListPath = path.join(__dirname, 'liste_francais_utf8.txt');
const wordList = fs.readFileSync(wordListPath, 'utf8').split('\n');

// Function to generate a random number based on the current date
function generateRandomNumber() {
  const date = new Date();
  const seed = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; // Using date as a seed
  const randomNumber = parseInt(seed.replace(/\D/g, ''), 10); // Extracting digits from the seed
  return randomNumber;
}

// Get the word corresponding to the random number
function getWordForDay(randomNumber) {
  const index = randomNumber % wordList.length;
  return wordList[index];
}

// Endpoint to handle the word guess
app.get('/guess/:word', (req, res) => {
  let guess = req.params.word.toLowerCase().trim();
  const randomNumber = generateRandomNumber();
  let wordForDay = getWordForDay(randomNumber).toLowerCase().trim();

  console.log('Word for the day:', wordForDay);

  // Perform Motus algorithm to check the guess
  var result = '';

  if (typeof wordForDay === 'undefined') {
    result = 'Failed to fetch word for the day.'; // Exit the function

  } else {
    
    // Pad wordForDay with spaces if it's shorter than guess
      if (wordForDay.length < guess.length) {
        wordForDay += ' '.repeat(guess.length - wordForDay.length);
    }

    // Pad guess with spaces if it's shorter than wordForDay
    else if (guess.length < wordForDay.length) {
        guess += ' '.repeat(wordForDay.length - guess.length);
    }

    let isCorrect = true;

    for(var i = 0; i < wordForDay.length; i++) {
        if (guess[i] === wordForDay[i]) {
          result += '<span style="background-color: green;">' + guess[i] + '</span>';
        } else if (wordForDay.includes(guess[i])) {
          result += '<span style="background-color: orange;">' + guess[i] + '</span>';
          isCorrect = false;
        } else {
          result += guess[i];
          isCorrect = false;
        }
    }

    // If the guess is correct, append a success message
    if (isCorrect) {
      result += '<p>Congratulations! You guessed the word!</p>';
    }

  }
  
  res.send(result);
});

// Endpoint to change seed value
app.get('/changeSeed/:seed', (req, res) => {
  const newSeed = req.params.seed;
  // Handle the new seed value (You can modify generateRandomNumber() to use this new seed)
  res.send(`Seed value changed to: ${newSeed}`);
});

// Serve static files
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

