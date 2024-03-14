# Application motus

## Explanation

This project is a motus game. The main app allow a user to play motus. It works with two other services : a service to manage the score and a service for authentication.

## Technical details

### Run the project

```bash
docker-compose up
```

### Play Motus

In your browser type :
```
localhost:3000
```

If you are not connected, it will redirect you to authentification service. Once connected you will be able to play motus. At the end of the game, your score will be saved in the score service and displayed on the app.

### Details about servers and ports 

- The main app `motus` is running on port `3000`
- The `authentification` app is running on port `3003`
- The `redis-auth` database is running on port `16380`
- The `score` app is running on port `3001`
- The `redis-score` database is running on port `16379`

### Details about APIs

#### Motus APIs
- `/guess` : to compare the user's guess with the word to find and call the /setscore API if the user found the word.
  
  The param is `word` the user's guess
  
  The response is a html with the result of the comparison

- `metrics` : to get the metrics of request done and the number of successful authentication
  
  The response is a json with the metrics or an error message

#### Authentification APIs
- `authorize` : to check if the client id is valid
  
  The params are `clientid` and `redirect_uri` 
  
  The response is either a redirection to the /login API with a code or an error message

- `/register` : to register a new user
  
  The params are `username` and `password`

  The response is a message to confirm the registration or an error message

- `/login` : to log in the user
  
  The params are `username` and `password`

  The response is a message to confirm the login or an error message

- `/redirect` : to redirect the user to the main app
  
  The redirect url is stor in the sessions parameters

  The response is a redirection to the main app with a token

#### Score APIs
- `/getscore` : to get the user's score
  
  The params are `player`

  The response is the user's score

- `/setscore` : to set the user's score
- 
  The params are `player` and `score`

  The response is a message to confirm the score update or an error message

### Store data
- The `auth` app uses a redis database to store the users' passwords
- The `score` app uses a redis database to store the users' scores

### Monitoring details 

Grafana is running on port `3004` and Prometheus is running on port `9090`

Logs are stored in a loki database running on port `3100`

If you want to visualize the logs, you can go to `localhost:3004` and add a new datasource with the url `http://loki:3100`

To visualize the metrics, you can go to `localhost:3004` and add a new datasource with the url `http://prometheus:9090`

Node exporter is running on port `9100`, you can vizualize the metrics on `http://localhost:9100/metrics`

### API Organisation

```mermaid
flowchart LR
    A[user] --> B(motus)
    B --> |guess| B
    B --> |get_score| C(score)
    B -->|set_score| C
    C --> E[redis-auth]
    B --> |authorize| D(auth)
    D --> F[redis-score]
    D --> |login / register| D
    D --> |redirect| B
```


