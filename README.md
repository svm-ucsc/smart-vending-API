# Smart Vending Machine API server

## Project Structure

    .
    ├── .github/workflows
    │   ├── CICD.yml        # github actions workflow
    ├── plugins             # Managed plugins for Fastify
    ├── routes              # Folder structure creates route structure
    │   ├── items           # /items route
    │   │   ├── index.js    # the js code executed when the /items route is called
    │   ├── root.js         # the js code executed when the / routs is called
    ├── app.js              # Main server app
    ├── package.json            
    └── README.md

## Project Setup

### Run npm install

`npm i`

### Set up your AWS credentials

The website makes API call which involve pulling data from DynamoDB. In order to run these calls locally, you need to configure your AWS credentials file. You need a creds file like `[your-name]_credentials.csv`. This file contains your **Access key ID** and **Secret access key**. ***Do not share these keys with anyone.*** Follow [these instructions](https://docs.aws.amazon.com/sdk-for-net/v3/developer-guide/creds-file.html) to tell the server to use your credentials file. Once this is done, you can run the server using the intructions below.

## How to...

### Work on the server

1. Start the fastify server in dev mode\
`npm run dev`

2. Open [http://localhost:3000](http://localhost:3000)

3. The server will automatically refresh with file changes

## Available Scripts

### Server (root)

#### `npm run dev`

Starts the fastify server in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.\

#### `npm start`

Starts the fastify server in prod mode.\
This is the command that the prod box runs.

