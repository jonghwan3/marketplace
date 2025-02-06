# How to run on Docker

## Simply run market web application using docker-compose
Note that the following command is run on market directory

You should run docker before the following command
```
docker-compose up --build
```
The above command will run entire system using `Docker-Compose` including Frontend (`React` + `Typescript`), Backend (`Golang`, `Python`), and Database (`PostgreSQL`) with `GraphQL` protocol.

You can see `Listening and serving HTTP on :8080`, when it succeeds.

### Optional
Clear database and docker image caches
```
docker-compose down --volumes
docker image prune
```
Clear docker system completely
```
docker system prune -a
```

Access database
```
psql -h localhost -U admin -d market
```