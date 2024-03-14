const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const request = require('request');
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const prometheus = require('prom-client');


const apiUrl_setscore = 'http://score-app:3001/setscore';
const apiUrl_token = 'http://auth-app:3003/token';
const app = express()
const port = 3000

const wordListPath = path.join(__dirname, 'liste_francais_utf8.txt');
const wordList = fs.readFileSync(wordListPath, 'utf8').split('\n');

const loki_uri = process.env.LOKI || "http://127.0.0.1:3100";

const logger = createLogger({
  transports: [
    new LokiTransport({
      host: loki_uri
    })
  ]
});

// Create Prometheus metrics
const httpRequestCounter = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
});

const loginCounter = new prometheus.Counter({
  name: 'login_total',
  help: 'Total number of successful logins',
});

// Register metrics with Prometheus
prometheus.register.registerMetric(httpRequestCounter);
prometheus.register.registerMetric(loginCounter);

// Middleware to count HTTP requests
app.use((req, res, next) => {
  httpRequestCounter.inc();
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await prometheus.register.metrics();
    res.set('Content-Type', prometheus.register.contentType);
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Set up session middleware
app.use(session({
  secret: 's3Cur3',
  name: 'sessionId',
  cookie: {
    httpOnly: true, 
    path: '/',
    clientid: 'motus', 
    redirect_uri: 'http://localhost:3000/callback',
    expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  }
}));

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

      // TODO : bien calculer le score
      // TODO : afficher le score une fois sauvegardé

      const requestData = {
        player: 'User0',
        score: 42
      };

      const options = {
        url: apiUrl_setscore,
        method: 'POST',
        json: true,
        body: requestData
      };

      request(options, (error, response, body) => {
        if (error) {
            console.error('Erreur :', error);
        } else {
            console.log('Code de statut :', response.statusCode);
            console.log('Réponse :', body);
        }
      });

    }

  }
  
  res.send(result);
});

// Endpoint for callback from authentication server
app.get('/callback', (req, res) => {
  const { code } = req.query
  req.session.token = code;
  console.log('Token:', req.session.token);
  // call /token to get the username associated to the code
  const options = {
    url: apiUrl_token,
    method: 'POST',
    json: true,
    body: {
      code: code
    }
  };
  request(options, (error, response, body) => {
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Status code:', response.statusCode);
      console.log('Body:', body);
      req.session.user = body.username;
      console.log('User:', req.session.user);
      res.redirect('/');
    }
  });
});

// Middleware to check if user is logged in
app.use((req, res, next) => {
  
  logger.info({ message: 'URL '+req.url , labels: { 'url': req.url, 'user':req.session.user } })
  
  module.exports = logger;

  if (req.session.user
    || req.path === '/login.html' 
    || req.path === '/login' 
    || req.path === '/session' 
    || req.path === '/register' 
    || req.path === '/register.html') {

    console.log('\t[+] Find user:', req.session.user);
    loginCounter.inc();

  } else {
    console.log('\t[-] No user logged:', req.session.user);
    // User is not logged in, redirect to authentication server
    const authServerUrl = 'http://localhost:3003/authorize';
    // Redirect to authentication server with OpenID parameters
    const redirectUrl = `${authServerUrl}?clientid=${req.session.cookie.clientid}&redirect_uri=${req.session.cookie.redirect_uri}`;
    console.log('Redirecting to:', redirectUrl);
    return res.redirect(redirectUrl);
  }

  console.log('\t[=] Auth ok now exec the app:', req.session.user);
  return next();
});


console.log('\t[*] App is happy and runing :)');

// Serve static files
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

