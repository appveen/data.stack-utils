const { Storage } = require('@google-cloud/storage');
const fs = require("fs");
const log4js = require('log4js');

const logLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
log4js.configure({
    levels: {
        AUDIT: { value: Number.MAX_VALUE - 1, colour: 'yellow' }
    },
    appenders: { out: { type: 'stdout', layout: { type: 'basic' } } },
    categories: { default: { appenders: ['out'], level: logLevel.toUpperCase() } }
});
let version = require('../package.json').version;
const loggerName = process.env.HOSTNAME ? `[${process.env.DATA_STACK_NAMESPACE}] [${process.env.HOSTNAME}] [STORAGE_ENGINE ${version}]` : `[STORAGE_ENGINE ${version}]`;
let logger = log4js.getLogger(loggerName);


let e = {};


e.uploadFile = async (data) => {
    try {
        logger.debug(`Uploading file to Google Cloud Storage Bucket : ${data.file.metadata.filename}`);
        logger.debug(JSON.stringify({
            bucket: data.bucket,
            projectId: data.projectId
        }));

        const storage = new Storage({
            projectId: data.projectId,
            keyFilename: data.gcsConfigFilePath
        });

        let uploadParams = {
            destination: data.file.fileName,
            preconditionOpts: { ifGenerationMatch: 0 }
            // Metadata: {
            //     'data_stack_filename': data.file.metadata.filename,
            //     'data_stack_app': data.appName,
            //     'data_stack_dataServiceId': data.serviceId,
            //     'data_stack_dataServiceName': data.serviceName
            // }
        };

        let bucket = await storage.bucket(data.bucket);

        await bucket.upload(data.file.path, uploadParams);

        logger.info(`Upload Success :: ${JSON.stringify(bucket)}`);
    } catch (err) {
        logger.error(`Error uploading file to Google Cloud Storage :: ${err}`);
    }
};


e.downloadFile = async (data) => {
    try {
        logger.debug(`Downloading file from Google Cloud Storage Bucket : ${data.fileName}`);
        logger.debug(JSON.stringify({
            bucket: data.bucket,
            projectId: data.projectId
        }));

        const storage = new Storage({
            projectId: data.projectId,
            keyFilename: data.gcsConfigFilePath
        });

        const options = {
            destination: data.tmpFilePath,
        };

        let bucket = await storage.bucket(data.bucket);

        await bucket.file(data.fileName).download(options);

        logger.info(`Download Success :: ${JSON.stringify(bucket)}`);
    } catch (err) {
        logger.error(`Error downloading file from Google Cloud Storage :: ${err}`);
    }
};


module.exports = e;
