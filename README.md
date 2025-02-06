# How to run on local
# Backend
## Database : PostgreSQL
### Start DB
To start `postgresql` service,
```
brew services start postgresql
```
To stop
```
brew services stop postgresql
```
### Create user on DB
Enter `psql` for user role management
```
psql -U {your_super_username} -d postgres # superuser; default user on your device
```
Once inside `psql`, switch to your market database:
```
\c market
```
Run the following SQL commands to create a user and set a password:
```
CREATE USER {your_username} WITH PASSWORD 'your_password'; # not superuser
```
Grant privileges
```
GRANT ALL PRIVILEGES ON DATABASE market TO {your_user};
```
Check users
```
\du
```
### Create DB, Table
Create a DB
```
createdb market
```
After create a DB, set up your db schema (you should connect database through this username and password, because otherwise there will an error DB.AutoMigrate(&User{}))
```
psql -d market -U {your_username} -f models/schema.sql # not superuser
```
Check previleges on specific table
```
\dp table_name
```
Check tables
```
\dt
```
Exit `psql`
```
\q
```
Drop the table
```
Drop table table_name;
```
## Server (Go)
Run go server
```
go run main.go
```
# Frontend
## React (with typescript)
install libs
```
npm install axios react-router-dom react-scripts
```
install libs regarding `typescript`
```
npm install --save-dev typescript @types/react @types/react-dom @types/react-router-dom
```
Add the following on `package.json`
```
"scripts": {
    "start": "react-scripts start"
  }
```
Init `tsconfig.json`
```
npx tsc --init
```
Add the following into `tsconfig.json`
```
{
  "compilerOptions": {
    "target": "ES6",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```



# How to run on Docker

## 1. Simply run market web application using docker-compose
Note that the following command is run on market directory

You should run docker before the following command
```
docker-compose up --build
```
The above command will run entire system using `Docker-Compose` including Frontend (`React` + `Typescript`), Backend (`Golang`), and Database (`PostgreSQL`) with `GraphQL` protocol.

You can see `Listening and serving HTTP on :8080`, when it succeeds.

## 2. Merchant scenario
Before testing customer scenario, let's first list items on our online market.

As Postman does not support `export` for GraphQL, by using Makefile containing curl commands, we can register merchants and itemss.

Register `Wilson Corp`, `Ray Corp` merchants using `make` (On another terminal)
```
make registerWilson registerRay
```

You can see similar response to the following when registration succeeds
```
"data": {
              "register": {
                      "email": "wilson@gmail.com",
                      "id": "1",
                      "name": "Wilson Corp"
              }
      }
```

After merchants registration, we can list items.
```
make createItemsWilson createItemsRay
```
## 3. Customer scneario
Now, we can access to frontend server (Input the following on your browser such as Chrome)
```
http://localhost:3000 
```
First register using user Name, Email, and Password.

Then, you can login and you explore the following functions freely:

- **Buy an item**
- **Add to cart**
- **Proceed to buy all items in your cart**
- **Logout**

Additionally, you can do (in addition to the given requirements)

- **Get purchase history**

## 4. More merchant curl commands
- **Remove Wilson merchant Item**
```
make removeWilsonItem 
```
You can modify `id` on Makefile if you want to delete another item. (After you executes it, you will get an error message with the same `id` since it was already removed)
- **Remove Ray merchant Item**
```
make removeRayItem 
```
- **Remove Ray merchant Item from Wilson merchant Item (Security Check)** 
```
make removeDifferentMerchantItem
```
Should get an error message like `unauthorized: you can only delete items you created` since each merchant can only access each one's endpoints
- **Get unsold Wilson merchant's Items**
```
make getUnsoldWilsonItems 
```
- **Get sold Wilson merchant's Items**
```
make getSoldWilsonItems 
```
You can modify `startDate` and `endDate` on Makefile
- **Get all items from merchant (Security check)**
```
make getAllItemsFromMerchant
```
Should get an error message like `unauthorized: merchants cannot access this resource` since merchant cannot use customers endpoints

Similarly, customers also cannot get access to merchants endpoints. Let's check with the following commands

First, register a customer
```
make registerCustomer
```
And then 
```
make getUnsoldWilsonItemsFromCustomer
```
You will get an error message like `unauthorized: only merchants can get unsold item listings`

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