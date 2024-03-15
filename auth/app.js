const express = require('express');
const session = require('express-session');
const redis = require('redis');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');

const app = express();

const LOGIN_URL = 'http://localhost:3003/login.html';
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:16380'
const PORT = process.env.PORT || 3003;

const redisClient = redis.createClient({url:REDIS_URL});

app.set('trust proxy', 1);

app.use(session({
  secret: 's3Cur3',
  name: 'sessionId',
  cookie: {
    httpOnly: true, 
    path: '/', 
    expires: new Date(Date.now() + 60 * 60 * 1000)
  }
}));

app.use(express.json());

/* ********** Authorization endpoint ********** */
app.get('/authorize', (req, res) => {
    const { clientid, redirect_uri } = req.query;

    if (clientid != 'motus') {
        console.log('Invalid client ID:', clientid);
        return res.status(400).send('Invalid client ID');
    }

    console.log('Authorizing client:', clientid, 'with redirect_uri:', redirect_uri);

    // Redirect to login page
    const redirectUrl = LOGIN_URL + '?client_id=' + clientid + '&redirect_uri=' + redirect_uri;
    res.redirect(redirectUrl);
});


redisClient.on('error', (err) => {
    console.error('Redis Error:', err);
  });

redisClient.connect().then(() => {
    console.log('Connected to Redis at:', REDIS_URL);

    /* ********** Register endpoint ********** */
    app.post('/register', (req, res) => {
        const { username, password } = req.body;

        console.log('Registering user:', username);
    
        // Check if the username already exists in Redis
        redisClient.get('user:' + username + ':password').then((reply) => {
    
            if (reply) {
                console.log('Username already exists:', username);
                res.status(400).json({ message: "Username already exists" });
                
            } else {
                // Hash the password before storing it in Redis
                const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

                // Generate a random code
                const randomCode = uuid.v4();

                redisClient.set('user:' + username + ':code', randomCode).then(() => {
                    console.log('Code stored successfully for user:', username);
                }).catch((err) => {
                    console.error('Error storing code:', err);
                });

                // Username doesn't exist, store it in Redis
                redisClient.set('user:' + username + ':password', hashedPassword).then(() => {
                    console.log('Password stored successfully for user:', username);
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

    /* ********** Login endpoint ********** */
    app.post('/login', (req, res) => {
        const { username, password } = req.body;

        console.log('Logging in user:', username);

        // Hash the password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Check if the provided username exists in Redis
        redisClient.get('user:' + username + ':password').then((reply) => {
            if (reply === hashedPassword) {
                // Correct username and password

                req.session.user = username;

                console.log('User logged in:', username);

                // Get the code from redis 
                redisClient.get('user:' + username + ':code').then((reply) => {
                    const randomCode = reply;
                    const { client_id, redirect_uri } = req.query;                

                    const redirectUrl = `${redirect_uri}?code=${randomCode}`;
                    req.session.redirect_uri = redirectUrl;

                    console.log('Code get successfully for user:', username);
                    res.json({ message: "Login successful" });
                }).catch((err) => {
                    console.error(err);
                    res.status(500).json({ message: 'Internal server error' });
                });

            } else {
                // Incorrect username or password
                console.log('Incorrect username or password');
                res.status(401).json({ message: "Incorrect username or password" });
            }
        }).catch((err) => {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        });
    });
});

/* ********** Redirect endpoint ********** */
app.get('/redirect', (req, res) => {
    console.log('Redirecting to:', req.session.redirect_uri);
    res.redirect(req.session.redirect_uri);
  });

/* ********** Token endpoint ********** */
app.post('/token', (req, res) => {
    const { code } = req.body;

    console.log('Exchanging code for token:', code);

    redisClient.keys('user:*:code').then((reply) => {

        const keys = reply;

        let found = false;

        keys.forEach(key => {

            redisClient.get(key).then((storedCode) => {

                if (storedCode === code) {
                    const username = key.split(':')[1];
                    console.log('Code exchanged successfully for token:', code);
                    res.json({ username: username });
                    found = true;
                }

                if (!found && keys.indexOf(key) === keys.length - 1) {
                    console.log('Invalid code:', code);
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
      res.redirect(LOGIN_URL);
    }
  });

app.use(express.static('static'));

/* ********** Session endpoint ********** */
app.get('/session', (req, res) => {
    res.json(req.session);
  });  

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });