const mongoose = require('mongoose');
const log4js = require('log4js');

log4js.configure({
    appenders: { out: { type: 'stdout', layout: { type: 'basic' } } },
    categories: { default: { appenders: ['out'], level: 'INFO' } }
});

const version = require('../package.json').version;
const loggerName = process.env.HOSTNAME
    ? `[${process.env.DATA_STACK_NAMESPACE}] [${process.env.HOSTNAME}] [db-utils ${version}]`
    : `[db-utils ${version}]`;

const logger = log4js.getLogger(loggerName);

/**
 * Fetch runtime environment variables from the database.
 * @returns {Promise<Object>} A Promise that resolves with 
 * the environment variables as a key-value paired object.
 * @throws {Error} If the MongoDB connection is not established 
 * or no environment variables are found in the database.
 */
async function fetchEnvVariables() {
    try {
        logger.info('Fetching runtime environment variables...');

        const dbConnection = mongoose.connection;
        
        if (dbConnection.readyState !== 1) {
            throw new Error('MongoDB connection is not established');
        }

        const collection = dbConnection.db.collection('config.envVariables');
        const pipeline = [
            {
                $match: {
                    classification: 'Runtime'
                }
            },
            {
                $project: {
                    _id: 1,
                    value: 1
                }
            }
        ];

        const result = await collection.aggregate(pipeline).toArray();

        if (result.length === 0) {
            throw new Error('No environment variables found in the database');
        }

        const envVariables = {};
        result.forEach(item => {
            envVariables[item._id] = item.value;
        });

        return envVariables;
    } catch (error) {
        logger.error(`Error fetching runtime environment variables: ${error.message}`);
        throw error;
    }
}

module.exports = {
    fetchEnvVariables: fetchEnvVariables
};
