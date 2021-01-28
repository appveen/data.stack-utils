let NATS = require('node-nats-streaming');
let client = null;
let log4js = require('log4js');

let version = require('./package.json').version;
log4js.configure({
    appenders: { out: { type: 'stdout', layout: { type: 'basic' } } },
    categories: { default: { appenders: ['out'], level: 'INFO' } }
  });
let logger = log4js.getLogger(`[data.stack-streaming ${version}]`);

let init = (clusterName, clientId, config) => {

    client = NATS.connect(clusterName, clientId, config);
    client.on('error', function (err) {
        logger.error(err.message);
    });

    client.on('connect', function () {
        logger.info('Connected to streaming server');
    });

    client.on('disconnect', function () {
        logger.info('Disconnected from streaming server');
    });

    client.on('reconnecting', function () {
        logger.info('Reconnecting to streaming server');
    });

    client.on('reconnect', function () {
        logger.info('Reconnected to streaming server');
    });

    client.on('close', function () {
        logger.info('Connection closed to streaming server');
    });
    return client;
}

module.exports = {
    init: init
};