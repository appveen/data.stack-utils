let e = {};
const _ = require('lodash')
const mongoose = require("mongoose");

function isValue(a) {
    return a == null || !(typeof a == 'object');
}

function isArray(a) {
    return Array.isArray(a);
}

function isEqual(a, b) {
    return (_.isEqual(a, b));
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

e.getAuditPreSaveHook = (collectionName)=> {
    return function(next, req){
        if(req){
            let data = {};
            data.user = req.headers ? req.get("user") : null;
            data.txnId = req.headers ? req.get('TxnId') : null;
            data.timestamp = new Date();
            data.data = {};
            if(this._id){
                mongoose.connection.db.collection(collectionName).findOne({_id: this._id})
                .then(doc => {
                    data.data.old = doc ? doc : null;
                    this._auditData = data;
                    next();
                });
            }else{
                this._auditData = data;
                next();
            }
        }
        else{
            next();
        }
    };
};

e.getAuditPostSaveHook = (collectionName,client,queueName)=>{
    return function(doc){
        if(doc._auditData){
            let oldData = doc._auditData.data.old;
            let newData = doc.toJSON();
            delete doc._auditData.data;
            let auditData = doc._auditData;
            auditData.colName = collectionName;
            auditData._metadata = {};
            auditData._metadata.deleted = false;
            auditData.data = {};
            auditData.data._id = doc._id;
            auditData.data.new = {};
            auditData.data.old = {};
            auditData._metadata.createdAt = new Date();
            auditData._metadata.lastUpdated = new Date();
            getDiff(oldData, newData, auditData.data.old, auditData.data.new);
            if(!_.isEqual(auditData.data.old, auditData.data.new))
                client.publish(queueName, JSON.stringify(auditData));
        }
    };
};

e.getAuditPreRemoveHook = ()=>{
    return function(next, req){
        if(req){
            let data = {};
            data.user = req.headers ? req.get("user") : null;
            data.txnId = req.headers ? req.get('TxnId') : null;
            data.timestamp = new Date();
            data.data = {};
            data._metadata = {};
            data._metadata.createdAt = new Date();
            data._metadata.lastUpdated = new Date();
            data.data.new = null;
            data.data.old = this.toJSON();
            data.data._id = this._id;
            data._metadata.deleted = false;
            this._auditData = data;
        }
        next();
    };
};

e.getAuditPostRemoveHook = (collectionName,client,queueName)=>{
    return function(doc){
        if(doc._auditData){
            doc._auditData.colName = collectionName;
            client.publish(queueName, JSON.stringify(doc._auditData));}
    };
};

module.exports = e;
