var helperUtil = require('../eventsUtil/constants');
var eventPriorityMap = helperUtil.eventPriorityMap;
var client = null;

let log4js = require('log4js');

log4js.configure({
    appenders: { out: { type: 'stdout', layout: { type: 'basic' } } },
    categories: { default: { appenders: ['out'], level: 'INFO' } }
  });
let logger = log4js.getLogger('[data.stack-eventsUtil]');

function setNatsClient(natsClient) {
    client = natsClient;
}
/**
 * 
 * @param {string} eventId The Event ID to Identify an Event
 * @param {string} source Module from which it is originated
 * @param {*} req The Incomming Request Object
 * @param {*} doc The Document Object of the Source Module
 * @param {*} [partner] The Partner Document Object. (Only if origin is flow)
 */
function publishEvent(eventId, source, req, doc, partner) {
    try {
        let payload = {
            "eventId": eventId,
            "source": source,
            "documentId": doc._id,
            "documentName": doc.name,
            "app": doc.app,
            "timestamp": new Date().toISOString(),
            "priority": eventPriorityMap[eventId],
        }
        if (req) {
            payload.triggerType = 'user';
            payload.triggerId = req.get('user');
            payload.txnId = req.get('txnId');
        } else {
            payload.triggerType = 'cron';
            payload.triggerId = 'AGENT_HB_MISS';
        }
        if (partner) {
            payload.partnerId = partner._id;
            payload.partnerName = partner.name;
        }
        if (client) {
            client.publish('events', JSON.stringify(payload));
            logger.debug('Event published');
        } else {
            logger.error('Client not initialised to publish events');
        }
    } catch (e) {
        logger.error('Publish event', e);
    }
}

module.exports = {
    setNatsClient: setNatsClient,
    publishEvent: publishEvent
}