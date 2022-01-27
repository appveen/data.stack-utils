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

e.uploadFile = async (file, connectionString, containerName) => {
  logger.info('Uploading file to Azure Blob');
  logger.debug(JSON.stringify({ containerName, blobName: file.filename }));

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(file.filename);

  try {
    let stream = fs.createReadStream(file.path);

    await blockBlobClient.uploadStream(stream, uploadOptions.bufferSize, uploadOptions.maxBuffers,
      { blobHTTPHeaders: { blobContentType: file.contentType }, metadata : { filename: file.metadata.filename } });

    logger.info('File uploaded to Azure Blob storage.');
    return file;
  } catch (err) {
    logger.error('Error Uploading File to Azure Blob - ', err.message);
    throw new Error(err);
  }
};

e.downloadFileBuffer = async (fileName, connectionString, containerName) => {
  logger.info('Downloading File as Buffer from Azure Blob');
  logger.debug(JSON.stringify({ containerName, blobName: fileName }));

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  const downloadBlockBlobResponse = await blockBlobClient.download(0);

  return new Promise((resolve, reject) => {
    const chunks = [];
    downloadBlockBlobResponse.readableStreamBody.on("data", (data) => {
      chunks.push(data);
    });
    downloadBlockBlobResponse.readableStreamBody.on("end", () => {
      var chunk = Buffer.concat(chunks);
      logger.debug('Downloaded Buffer from Azure Blob.');
      resolve(chunk);
    });
    downloadBlockBlobResponse.readableStreamBody.on("error", function (err) {
      logger.error('Error downloading file from Azure Blob - ', err.message);
      reject(err);
    });
  });
};

e.downloadFile = async (fileName, connectionString, containerName, res) => {
  logger.info('Downloading File from Azure Blob.');
  logger.debug(JSON.stringify({ containerName, blobName: fileName }));

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  const downloadBlockBlobResponse = await blockBlobClient.download(0);

  return new Promise((resolve, reject) => {
    const chunks = [];
    downloadBlockBlobResponse.readableStreamBody.on("data", (data) => {
      chunks.push(data);
    });

    downloadBlockBlobResponse.readableStreamBody.on("end", () => {
      var chunk = Buffer.concat(chunks);
      logger.debug('Downloaded File from Azure Blob.');
      resolve(chunk);
    }).pipe(res);
    
    downloadBlockBlobResponse.readableStreamBody.on("error", function (err) {
      logger.error('Error downloading file from Azure Blob - ', err.message);
      reject(err);
    });
  });
};

e.downloadFileLink = async (file, connectionString, containerName, sharedKey, timeout) => {
  logger.info('Generating file download link for Azure Blob.');
  logger.debug(JSON.stringify({ containerName, blobName: file.filename, timeout }));

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(file.filename);

  const sharedKeyCred = new StorageSharedKeyCredential(containerClient.accountName, sharedKey);

  const sasOptions = {
    containerName: containerClient.containerName,
    blobName: file.filename,
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + parseInt(timeout)),
    permissions: BlobSASPermissions.parse('r'),
    contentDisposition: 'attachment; filename="' + file.metadata.filename + '"',
    contentType: file.contentType
  };

  logger.trace('SAS Options - ', JSON.stringify(sasOptions));

  const sasToken = generateBlobSASQueryParameters(sasOptions, sharedKeyCred).toString();

  logger.trace('SAS Token - ', sasToken);

  logger.info(`Download Url for ${file.filename} :: ${blockBlobClient.url}?${sasToken}`);

  return `${blockBlobClient.url}?${sasToken}`
}

module.exports = e;
