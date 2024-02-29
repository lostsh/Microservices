const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(bodyParser.json());

// Create a Redis client
const redisClient = redis.createClient();

// Redis error handling
redisClient.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Connect to Redis
redisClient.connect().then(() => {
  console.log('Connected to Redis');
  
  // Endpoint to set score for a player
  app.post('/setscore', (req, res) => {
    const { player, score } = req.body;
    // Store score in Redis
    redisClient.set(player, score).then(() => {
      console.log('Score set successfully');
      res.status(200).json({ message: 'Score updated successfully.' });
    }).catch((err) => {
      console.error('Error setting score:', err);
      res.status(500).json({ message: 'Error setting score.' });
    });
  });

  // Endpoint to get score for a player
  app.get('/getscore', (req, res) => {
    const { player } = req.query;
    // Retrieve score from Redis
    redisClient.get(player).then((score) => {
      if (score !== null) {
        console.log('Score retrieved successfully:', score);
        res.status(200).json({ player, score });
      } else {
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
