var helperUtil = require('@appveen/odp-utils/eventsUtil/constants');
var eventPriorityMap = helperUtil.eventPriorityMap;
var client = null;

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
        let logger = global.logger;
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
            logger.info('Event published');
        } else {
            logger.error('client not found to publish events');
        }
    } catch (e) {
        logger.error('publishEvent', e);
    }
}

module.exports = {
    setNatsClient: setNatsClient,
    publishEvent: publishEvent
}