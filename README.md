#### This web application facilitates buying and selling items, similar to Facebook Marketplace, with a key feature that uses image recognition to automatically generate item specifications, making it easier for sellers to create listings


https://github.com/user-attachments/assets/42857ea4-6ecd-400d-8874-ba6f6a62f7d6


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
