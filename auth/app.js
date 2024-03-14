const express = require('express');
const session = require('express-session');
const redis = require('redis');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const app = express();

// Trust first proxy
app.set('trust proxy', 1);

// Set up session middleware
app.use(session({
  secret: 's3Cur3',
  name: 'sessionId',
  cookie: {
    httpOnly: true, 
    path: '/', 
    expires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  }
}));

app.use(express.json());

// Authorization endpoint
app.get('/authorize', (req, res) => {
    const { clientid, redirect_uri } = req.query;

    if (clientid != 'motus') {
        return res.status(400).send('Invalid client ID');
    }

    // Redirect to login page
    const redirectUrl = 'http://localhost:3003/login.html?client_id=' + clientid + '&redirect_uri=' + redirect_uri;
    res.redirect(redirectUrl);
});

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:16380'

console.log('REDIS_URL:', REDIS_URL);
const redisClient = redis.createClient({url:REDIS_URL});

// Redis error handling
redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
  });

redisClient.connect().then(() => {
    console.log('Connected to Redis');

    // Register route
    app.post('/register', (req, res) => {
        const { username, password } = req.body;
    
        // Check if the username already exists in Redis
        redisClient.get(username).then((reply) => {
    
            if (reply) {
                // Username already exists
                res.status(400).json({ message: "Username already exists" });
                
            } else {
                // Hash the password before storing it in Redis
                const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

                const randomCode = uuid.v4();

                redisClient.set('user:' + username + ':code', randomCode).then(() => {
                    console.log('Code stored successfully:', reply);
                }).catch((err) => {
                    console.error('Error storing code:', err);
                });

                // Username doesn't exist, store it in Redis
                redisClient.set('user:' + username + ':password', hashedPassword).then(() => {
                    res.status(201).json({ message: "Registration successful" });
                }).catch((err) => {
                    console.error(err);
                    res.status(500).json({ message: 'Internal server error' });
                });

            }
        }).catch((err) => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        });
    });

    // Login route
    app.post('/login', (req, res) => {
        const { username, password } = req.body;

        // Hash the password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Check if the provided username exists in Redis
        redisClient.get('user:' + username + ':password').then((reply) => {
            if (reply === hashedPassword) {
                // Username and password match
                req.session.user = username;

                // Get the code from redis 
                redisClient.get('user:' + username + ':code').then((reply) => {
                    const randomCode = reply;
                    // Redirect back to the client with the token appended as a query parameter
                    const { client_id, redirect_uri } = req.query;                

                    const redirectUrl = `${redirect_uri}?code=${randomCode}`;
                    req.session.redirect_uri = redirectUrl;

                    res.json({ message: "Login successful" });
                }).catch((err) => {
                    console.error(err);
                    res.status(500).json({ message: 'Internal server error' });
                });

            } else {
                // Incorrect username or password
                res.status(401).json({ message: "Incorrect username or password" });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        });
    });
});

app.get('/redirect', (req, res) => {
    // Handle the redirect URL
    console.log('Redirecting to:', req.session.redirect_uri);
    res.redirect(req.session.redirect_uri);
  });

// Endpoint for token exchange
app.post('/token', (req, res) => {
    const { code } = req.body;

    redisClient.keys('user:*:code').then((reply) => {

        const keys = reply;

        let found = false;

        keys.forEach(key => {
            redisClient.get(key).then((storedCode) => {
                if (storedCode === code) {
                    const username = key.split(':')[1];
                    res.json({ username: username });
                    found = true;
                }
                if (!found && keys.indexOf(key) === keys.length - 1) {
                    res.status(400).json({ message: "Invalid code" });
                }
            }).catch((err) => {
                console.error(err);
                res.status(500).json({ message: 'Internal server error' });
            });
        });
        
    }).catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    });
}
);

// Middleware to check if user is logged in
app.use((req, res, next) => {
    if (req.session.user 
        || req.path === '/login.html' 
        || req.path === '/login' 
        || req.path === '/session' 
        || req.path === '/register' 
        || req.path === '/register.html') {
      next();
    } else {
      res.redirect("/login.html");
    }
  });

app.use(express.static('static'));

app.get('/session', (req, res) => {
    // Display content of the session
    res.json(req.session);
  });  

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });