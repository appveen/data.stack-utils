let e = {};
const _ = require('lodash')
const mongoose = require("@datanimbus/mongoose");
let log4js = require('log4js');

let version = require('../package.json').version;
let loggerName = process.env.HOSTNAME ? `[${process.env.DATA_STACK_NAMESPACE}] [${process.env.HOSTNAME}] [data.stack-auditTrail ${version}]` : `[data.stack-auditTrail ${version}]`;
let logger = log4js.getLogger(loggerName);

function isValue(a) {
    return a == null || !(typeof a == 'object');
}

function isArray(a) {
    return Array.isArray(a);
}

function isEqual(a, b) {
    return (_.isEqual(a, b));
}

// user/txnId for the audit record. The hook gets either an options object ({ headers }), or the Express req
// cloned by mongoose into SaveOptions/RemoveOptions (its headers getter is lost, rawHeaders survive), or
// nothing useful, in which case doc._req set by the caller is used. Node lowercases header names (txnid).
function getAuditHeaders(req, doc) {
    let headers = (req && req.headers) || (doc && doc._req && doc._req.headers);
    if (!headers && req && Array.isArray(req.rawHeaders)) {
        headers = {};
        for (let i = 0; i + 1 < req.rawHeaders.length; i += 2) {
            headers[req.rawHeaders[i].toLowerCase()] = req.rawHeaders[i + 1];
        }
    }
    headers = headers || {};
    return {
        user: headers.User || headers.user || null,
        txnId: headers.TxnId || headers.txnId || headers.txnid || null
    };
}

function getDiff(a, b, oldData, newData) {
    if (a === null || b === null) {
        Object.assign(oldData, a);
        Object.assign(newData, b);
    }
    else if (typeof a == "object" && typeof b == "object") {
        Object.keys(a).forEach(_ka => {
            if (typeof b[_ka] == 'undefined') {
                oldData[_ka] = a[_ka];
                newData[_ka] = null;
            } else if (isValue(a[_ka]) || isArray(a[_ka])) {
                if (!isEqual(a[_ka], b[_ka])) {
                    oldData[_ka] = a[_ka];
                    newData[_ka] = b[_ka];
                }
                delete b[_ka];
            } else {
                oldData[_ka] = {};
                newData[_ka] = {};
                getDiff(a[_ka], b[_ka], oldData[_ka], newData[_ka]);
                if (_.isEmpty(oldData[_ka])) delete oldData[_ka];
                if (_.isEmpty(newData[_ka])) delete newData[_ka];
                delete b[_ka];
            }
        });
        Object.keys(b).forEach(_kb => {
            oldData[_kb] = null;
            newData[_kb] = b[_kb];
        });
    }
}

e.getAuditPreSaveHook = (collectionName) => {
    return function (next, req) {
        if (req) {
            let data = {};
            const auditHeaders = getAuditHeaders(req, this);
            data.user = auditHeaders.user;
            data.txnId = auditHeaders.txnId;
            data.timestamp = new Date();
            data.data = {};
            if (this._id) {
                mongoose.connection.db.collection(collectionName).findOne({ _id: this._id })
                    .then(doc => {
                        data.data.old = doc ? doc : null;
                        this._auditData = data;
                        next();
                    });
            } else {
                this._auditData = data;
                next();
            }
        }
        else {
            next();
        }
    };
};

e.getAuditPostSaveHook = (collectionName, client, queueName) => {
    return function (doc) {
        if (doc._auditData) {
            let oldData = doc._auditData.data.old;
            let newData = doc.toJSON();
            delete doc._auditData.data;
            let auditData = doc._auditData;
            auditData.colName = collectionName;
            auditData._metadata = {};
            auditData._metadata.deleted = false;
            auditData.data = {};
            auditData.data.app = doc.app;
            auditData.data._id = doc._id;
            auditData.data.new = {};
            auditData.data.old = {};
            auditData._metadata.createdAt = new Date();
            auditData._metadata.lastUpdated = new Date();
            const auditOnlyDiff = process.env.AUDIT_ONLY_DIFF ? (process.env.AUDIT_ONLY_DIFF.toString().toLowerCase() === 'true') : true;
            if (auditOnlyDiff) {
                getDiff(oldData, newData, auditData.data.old, auditData.data.new);
            } else {
                Object.assign(auditData.data.new, newData);
                Object.assign(auditData.data.old, oldData);
            }
            if (!_.isEqual(auditData.data.old, auditData.data.new))
                client.getQueue(queueName).add(queueName, auditData, {
                    removeOnComplete: true
                }).catch(err => logger.error(`[${auditData.txnId}] Audit enqueue failed (${collectionName}): ${err.message}`));
        }
    };
};

e.getAuditPreRemoveHook = () => {
    return function (next, req) {
        if (req) {
            let data = {};
            const auditHeaders = getAuditHeaders(req, this);
            data.user = auditHeaders.user;
            data.txnId = auditHeaders.txnId;
            data.timestamp = new Date();
            data.data = {};
            data._metadata = {};
            data._metadata.createdAt = new Date();
            data._metadata.lastUpdated = new Date();
            data.data.new = null;
            data.data.old = this.toJSON();
            data.data._id = this._id;
            data.data.app = this.app;
            data._metadata.deleted = false;
            this._auditData = data;
        }
        next();
    };
};

e.getAuditPostRemoveHook = (collectionName, client, queueName) => {
    return function (doc) {
        if (doc._auditData) {
            doc._auditData.colName = collectionName;
            client.getQueue(queueName).add(queueName, doc._auditData, {
                removeOnComplete: true
            }).catch(err => logger.error(`[${doc._auditData.txnId}] Audit enqueue failed (${collectionName}): ${err.message}`));
        }
    };
};

module.exports = e;
