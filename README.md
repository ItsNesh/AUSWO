# AUSWO
IT Industry Project for AUSWO

![Database Schema](databaseSchema.png "Database Schema")

## Running with Docker

1. Build and start the containers:
   ```bash
   docker compose up --build
   ```

2. Create a .env file in root with the variables:
#SESSION_SECRET =  ** node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" ** Run this and then place in session_secret
GOOGLE_CLIENT_ID = 227608984263-fqq6iudhv9c71aaf61mao6t8td9m7oh7.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = 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
DB_HOST = localhost
DB_PORT = 3306
DB_USER = root
DB_NAME = AUSWO
DB_PASSWORD = AUSWO2025
PORT = 3000
NODE_ENV = development

3. The website can be viewed at [http://localhost:3000](http://localhost:3000).
4. The MySQL database listens on port `3306` with database `AUSWO` and password `test`.


Add npm install for each dependency found in the package.json file