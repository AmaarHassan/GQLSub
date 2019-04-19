
const express = require('express');
import {
    graphqlExpress,
    graphiqlExpress,
} from 'graphql-server-express';
import bodyParser from 'body-parser';
import cors from 'cors';

const schema = require('./schema/schema');

import { execute, subscribe } from 'graphql';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';

const mongoose = require('mongoose');
const config = require('./config.json');

mongoose.connect(config.mongoURL, function () { /* dummy function */ })
    .then(() => {
        //console.log('Connected with mongo');
    })
    .catch(err => { // mongoose connection error will be handled here
        console.error('Mongo connection error:', err.stack);
        process.exit(1);
    });

mongoose.connection.once('open', () => {
    //console.log('Connected to database');
});

/** somthing something something  something something something */
const PORT = 8000;
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
        schema
    }, {
            server: ws,
            path: '/subscriptions',
        });
});