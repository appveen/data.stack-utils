const { BlobServiceClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob');
const fs = require("fs");
let log4js = require('log4js');

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

const ONE_MEGABYTE = 1024 * 1024;
const uploadOptions = { bufferSize: 4 * ONE_MEGABYTE, maxBuffers: 20 };

let e = {};

e.uploadFile = async (data) => {
  logger.debug(`Uploading file to Azure Blob : ${data.file.metadata.filename}`);
  logger.debug(JSON.stringify({
    containerName: data.containerName,
    blobName: data.file && data.file.filename,
    appName: data.appName,
    serviceName: data.serviceName
  }));

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(data.connectionString);
    const containerClient = blobServiceClient.getContainerClient(data.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(data.file.filename);

    let stream = fs.createReadStream(data.file.path);

    await blockBlobClient.uploadStream(stream, uploadOptions.bufferSize, uploadOptions.maxBuffers,
      {
        blobHTTPHeaders: { blobContentType: data.file.contentType },
        metadata: {
          'data_stack_filename': data.file.metadata.filename,
          'data_stack_app': data.appName,
          'data_stack_dataservice': data.serviceName
        }
      });

    logger.debug(`File uploaded to Azure Blob storage. : ${data.file.metadata.filename}`);
    return data.file;
  } catch (err) {
    logger.error(`Error Uploading File to Azure Blob. : ${data.file.metadata.filename} : ${err.message}`);
    throw new Error(err);
  }
};

e.downloadFileBuffer = async (data) => {
  logger.debug(`Downloading File as Buffer from Azure Blob : ${data.fileName}`);
  logger.trace(JSON.stringify({ containerName: data.containerName, blobName: data.fileName }));

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(data.connectionString);
    const containerClient = blobServiceClient.getContainerClient(data.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(data.file.filename);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    return new Promise((resolve, reject) => {
      const chunks = [];
      downloadBlockBlobResponse.readableStreamBody.on("data", (data) => {
        chunks.push(data);
      });
      downloadBlockBlobResponse.readableStreamBody.on("end", () => {
        var chunk = Buffer.concat(chunks);
        logger.debug(`Downloaded buffer from Azure Blob : ${data.fileName}`);
        resolve(chunk);
      });
      downloadBlockBlobResponse.readableStreamBody.on("error", function (err) {
        logger.error(`Error downloading file from Azure Blob : ${data.fileName} : ${err.message}`);
        reject(err);
      });
    });
  } catch (err) {
    logger.error(`Error downloading file as buffer from Azure Blob : ${data.fileName} : ${err.message}`);
    throw new Error(err);
  }
};

e.downloadFile = async (data) => {
  logger.debug(`Downloading File from Azure Blob: ${data.fileName}`);
  logger.trace(JSON.stringify({ containerName: data.containerName, blobName: data.fileName }));

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(data.connectionString);
    const containerClient = blobServiceClient.getContainerClient(data.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(data.fileName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);

    return new Promise((resolve, reject) => {
      const chunks = [];
      downloadBlockBlobResponse.readableStreamBody.on("data", (d) => {
        chunks.push(d);
      });

      downloadBlockBlobResponse.readableStreamBody.on("end", () => {
        var chunk = Buffer.concat(chunks);
        logger.debug(`Downloaded File from Azure Blob : ${data.fileName}`);
        resolve(chunk);
      }).pipe(data.res);

      downloadBlockBlobResponse.readableStreamBody.on("error", function (err) {
        logger.error(`Error downloading file from Azure Blob : ${data.fileName} : ${err.message}`);
        reject(err);
      });
    });
  } catch (err) {
    logger.error(`Error downloading file from Azure Blob : ${data.fileName} : ${err.message}`);
    throw new Error(err);
  }
};

e.downloadFileLink = async (data) => {
  logger.debug(`Generating file download link for Azure Blob : ${data.file.filename}`);
  logger.trace(JSON.stringify({
    containerName: data.containerName,
    blobName: data.file && data.file.filename,
    timeout: data.timeout
  }));

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(data.connectionString);
    const containerClient = blobServiceClient.getContainerClient(data.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(data.file.filename);

    const sharedKeyCred = new StorageSharedKeyCredential(containerClient.accountName, data.sharedKey);

    const sasOptions = {
      containerName: containerClient.containerName,
      blobName: data.file && data.file.filename,
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + parseInt(data.timeout || "60000")),
      permissions: BlobSASPermissions.parse('r'),
      contentDisposition: 'attachment; filename="' + data.file.metadata.filename + '"',
      contentType: data.file.contentType
    };

    logger.trace(`SAS Options: ${data.file.filename} : `, JSON.stringify(sasOptions));

    const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCred).toString();

    logger.trace(`SAS Token : ${data.file.filename} : `, sasToken);

    logger.debug(`Download Url for ${data.file.filename} :: ${blockBlobClient.url}?${sasToken}`);

    return `${blockBlobClient.url}?${sasToken}`
  } catch (err) {
    logger.error('Error downloading file from Azure Blob - ', err.message);
    throw new Error(err);
  }
};

e.deleteFile = async (data) => {
  logger.debug(`Deleting file from Azure Blob : ${data.filename}`);
  logger.trace(JSON.stringify({
    containerName: data.containerName,
    blobName: data.filename,
  }));

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(data.connectionString);
    const containerClient = blobServiceClient.getContainerClient(data.containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(data.filename);
    const deleteContainerResponse = blockBlobClient.delete({ deleteSnapshots: "include" });
    
    logger.debug(`Blob file marked to be deleted on Azure : ${data.filename}`, deleteContainerResponse);
  } catch (err) {
    logger.error('Error deleting file from Azure Blob - ', err.message);
    throw new Error(err);
  }
};

module.exports = e;
