const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable All CORS Requests
app.use(cors());

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:16379'

app.use(bodyParser.json());

const redisClient = redis.createClient({url:REDIS_URL});

redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Connect to Redis
redisClient.connect().then(() => {
  console.log('Connected to Redis at:', REDIS_URL);
  
  /* ********** Set score endpoint ********** */
  app.post('/setscore', async (req, res) => {
    let { player, score } = req.body;

    try {
      // get previous score from Redis
      const prev_score_nb_try = await redisClient.get(player + ':nb_try');
      const prev_score_nb_words = await redisClient.get(player + ':nb_words');
  
      if (prev_score_nb_try !== null) {
        // Add previous score to the new score
        score += parseInt(prev_score_nb_try);
        console.log('Previous score found for:', player, 'with nb_try:', prev_score_nb_try);
      } else {
        console.log('Previous score not found for:', player);
      }
      
      let nb_words = 1;
      if (prev_score_nb_words !== null) {
        // Add previous score to the new score
        nb_words = parseInt(prev_score_nb_words) + 1;
        console.log('Previous score found for:', player, 'with nb_words:', prev_score_nb_words);
      } else {
        console.log('Previous score not found for:', player);
      }

      // Store score in Redis
      await redisClient.set(player + ':nb_try', score);
      console.log('Score set successfully for:', player, 'with nb_try:', score);

      await redisClient.set(player + ':nb_words', nb_words);
      console.log('Score set successfully for:', player, 'with nb_words:', score);

      res.status(200).json({ message: 'Score updated successfully.' });
    } catch (err) {
      console.error('Error setting score:', err);
      res.status(500).json({ message: 'Error setting score.' });
    }
  });

  /* ********** Get score endpoint ********** */
  app.get('/getscore', async (req, res) => {
    const { player } = req.query;
    // Retrieve score from Redis
    try {
      // get previous score from Redis
      const score_nb_try = await redisClient.get(player + ':nb_try');
      const score_nb_words = await redisClient.get(player + ':nb_words');
  
      if (score_nb_try !== null) {
        console.log('Score found for:', player, 'with nb_try:', score_nb_try);
      } else {
        console.log('Score not found for:', player);
      }

      if (score_nb_words !== null) {
        console.log('Score found for:', player, 'with nb_words:', score_nb_words);
      } else {
        console.log('Score not found for:', player);
      }

      res.status(200).json({ player, score_nb_try, score_nb_words});
    } catch (err) {
      console.error('Error setting score:', err);
      res.status(500).json({ message: 'Error setting score.' });
    }
  });
});

// Serve static files from the 'static' directory
app.use(express.static(path.join(__dirname, 'static')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
