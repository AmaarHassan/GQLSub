const express = require('express');
const graphqlHTTP = require('express-graphql');
const schema = require('./schema/schema.js');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config.json');
const bodyParser = require('body-parser');

const {
    graphqlExpress,
    graphiqlExpress,
} = require('graphql-server-express');

const graphql = require('graphql');
const { execute, subscribe } = graphql;
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');

mongoose.connect(config.mongoURL, function () { /* dummy function */ })
    .then(() => {
        console.log('Connected with mongo');
    })
    .catch(err => { // mongoose connection error will be handled here
        console.error('Mongo connection error:', err.stack);
        process.exit(1);
    });

mongoose.connection.once('open', () => {
    console.log('Connected to database');
});


/** somthing something something  something something something */
const PORT = 7900;
const server = express();

server.use('*', cors({ origin: 'http://localhost:3000' }));

server.use('/graphql', bodyParser.json(), graphqlExpress({
    schema
}));

server.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
}));

// We wrap the express server so that we can attach the WebSocket for subscriptions
const ws = createServer(server);

ws.listen(PORT, () => {
    console.log(`GraphQL Server is now running on http://localhost:${PORT}`);
    // Set up the WebSocket for handling GraphQL subscriptions
    new SubscriptionServer({
        execute,
        subscribe,
        schema,
        onConnect() {
            console.log('connected to subscription server');
        }
    }, {
            server: ws,
            path: '/subscriptions',
        });
});