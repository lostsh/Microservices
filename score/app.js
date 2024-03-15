const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:16379'

app.use(bodyParser.json());

let userscore = '';

const redisClient = redis.createClient({url:REDIS_URL});

redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Connect to Redis
redisClient.connect().then(() => {
  console.log('Connected to Redis');
  
  // Endpoint to set score for a player
  app.post('/setscore', (req, res) => {
    const { username, score, success} = req.body;

    // Check if the username already exists in Redis
    redisClient.get(username).then((userData) => {
        if (userData) {
            // If user data exists, parse the data
            const userDataArray = userData.split(';');
            const prevScore = parseInt(userDataArray[0]);
            const prevSuccess = parseInt(userDataArray[1]);
            const prevTimePlayed = parseInt(userDataArray[2]);

            // Update score
            const updatedScore = prevScore + parseInt(score);

            // Update success count if the attempt is successful
            const updatedSuccess = success ? prevSuccess + 1 : prevSuccess;

            // Update total time played
            const updatedTimePlayed = prevTimePlayed + 1;

            // Construct updated data string
            const updatedData = `${updatedScore};${updatedSuccess};${updatedTimePlayed}`;

            // Store updated data in Redis
            redisClient.set(username, updatedData, (err) => {
                if (err) {
                    console.error('Error setting user data in Redis:', err);
                    res.status(500).json({ message: 'Error setting user data.' });
                } else {
                    console.log('User data updated successfully');
                    res.status(200).json({ message: 'User data updated successfully.' });
                }
            });
        } else {
          // Update score
          const updatedScore = parseInt(score);

          // Update success count if the attempt is successful
          const updatedSuccess = success ?  1 : 0;

          // Update total time played
          const updatedTimePlayed = 1;

          // Construct updated data string
          const updatedData = `${updatedScore};${updatedSuccess};${updatedTimePlayed}`;

          redisClient.set(username, updatedData, (err) => {
              if (err) {
                  console.error('Error setting user data in Redis:', err);
                  res.status(500).json({ message: 'Error setting user data.' });
              } else {
                  console.log('User data updated successfully');
                  res.status(200).json({ message: 'User data updated successfully.' });
              }
          });
        }
    }).catch((err) => {
        console.error('Error getting user data from Redis:', err);
        res.status(500).json({ message: 'Error getting user data.' });
    });
  });

  /* ********** Get score endpoint ********** */
  app.get('/getscore', (req, res) => {
    const { player } = req.query;
    // Retrieve score from Redis
    redisClient.get(player).then((score) => {
      if (score !== null) {
        console.log('Score retrieved successfully for:', player, 'with score:', score);
        res.status(200).json({ player, score });
        userscore = score
      } else {
        console.log('Score not found for:', player);
        res.status(404).json({ message: 'Score not found for the player.' });
      }
    }).catch((err) => {
      console.error('Error getting score:', err);
      res.status(500).json({ message: 'Error getting score.' });
    });
  });
});

// Serve static files from the 'static' directory
app.use(express.static(path.join(__dirname, 'static')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
