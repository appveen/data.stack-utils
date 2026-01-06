const { Queue, Worker } = require('bullmq');
const IORedis = require('ioredis');
let log4js = require('log4js');

let connection = null;
let queues = {};
let workers = [];

const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
log4js.configure({
    appenders: { out: { type: 'stdout', layout: { type: 'basic' } } },
    categories: { default: { appenders: ['out'], level: logLevel.toUpperCase() } }
});

let version = require('../package.json').version;
let loggerName = process.env.HOSTNAME ? `[${process.env.DATA_STACK_NAMESPACE}] [${process.env.HOSTNAME}] [data.stack-queue ${version}]` : `[data.stack-queue ${version}]`;
let logger = log4js.getLogger(loggerName);

let init = (config) => {
    logger.debug(`config: ${JSON.stringify(config)}`);

    connection = new IORedis(config.redisUrl, {
        connectTimeout: config.connectTimeout,
        maxRetriesPerRequest: null
        // retryStrategy: (times) => {
        //     const delay = Math.min(times * 50, 2000);
        //     return delay;
        // }
    });
    connection.on('error', function (err) {
        logger.error(err.message);
    });

    connection.on('connect', function () {
        logger.info('Connected to Redis server');
    });

    connection.on('close', function () {
        logger.info('Connection closed to Redis server');
    });

    connection.on('reconnecting', function () {
        logger.info('Reconnecting to Redis server');
    });

    return connection;
}

let getQueue = (queueName, config = {}) => {
    if (!connection) {
        throw new Error('Queue not initialized. Call init() first.');
    }
    if (!queues[queueName]) {
        queues[queueName] = new Queue(queueName, { connection, ...config, removeOnFail: 100, removeOnComplete: true });
    }
    return queues[queueName];
}


function registerWorker(queueName, processor, config = {}) {
    if (!connection) {
        throw new Error('Queue not initialized. Call init() first.');
    }
    const concurrency = parseInt(config.workerConcurrency) || 1;

    let workerInstance = new Worker(
        queueName,
        async (job) => {
            try {
                logger.debug(`Processing job ${job.id}`);
                await processor(job.data);
            } catch (err) {
                logger.error(`Error processing job ${job.id}: ${err.message}`);
                throw err;
            }
        },
        { connection, concurrency }
    );

    workerInstance.on('completed', (job) => logger.debug(`Job ${job.id} completed`));
    workerInstance.on('failed', (job, err) => logger.error(`Job ${job.id} failed`, err));
    workers.push(workerInstance);
    logger.info(`Events worker started (${queueName}) concurrency=${concurrency}`);
    return workerInstance;
}

async function shutdown() {
    logger.info('Shutting down BullMQ...');

    for (const w of workers) {
        await w.close();
    }
    // Close Redis connection
    if (connection) {
        await connection.quit();
    }
    logger.info('BullMQ shutdown complete');
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

module.exports = {
    init: init,
    getQueue: getQueue,
    registerWorker: registerWorker,
    Queue: Queue,
    Worker: Worker
};
