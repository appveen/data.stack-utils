"use strict"

const req = require("./requestHandler");


let logger = global.logger;
if (!logger) {
    logger = {
        info: console.log,
        error: console.log,
        debug: console.log,
        trace: console.log
    };
}


const BASE_URL = "/api/v1";
const e = {};

function getErrorMessage(response) {
    if (response.body && typeof response.body === 'object') {
        return JSON.stringify(response.body);
    } else {
        return 'API returned ' + response.statusCode;
    }
}

e.getAllServices = async () => {
    logger.debug('KubeUtils :: Fetching All Services');
    try {
        let response = await req.get(BASE_URL + "/services");
        logger.trace(`KubeUtils :: Fetching All Services :: Response :: ${JSON.stringify(response)}`);
        if (!(response.statusCode >= 200 && response.statusCode < 400)) {
            throw new Error(getErrorMessage(response))
        }
        let data = response.body;
        let res = []
        data.items.forEach((item) => {
            res.push({
                name: item.metadata.name,
                namespace: item.metadata.namespace,
                type: item.spec.type,
                ports: item.spec.ports
            });
        });
        return { statusCode: response.statusCode, body: res };
    } catch (err) {
        logger.error(`KubeUtils :: Fetching All Services :: Error :: ${JSON.stringify(err)}`);
        return err;
    }
}


e.getAllServicesForNamespace = async (data) => {
    logger.debug(`KubeUtils :: Fetch All Services for Namespace :: ${data.namespace}`);
    try {
        let response = await req.get(BASE_URL + "/namespaces/" + data.namespace + "/services");
        logger.trace(`KubeUtils :: Fetch All Services for Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
        if (!(response.statusCode >= 200 && response.statusCode < 400)) {
            throw new Error(getErrorMessage(response));
        }
        let data = response.body;
        let res = [];
        data.items.forEach((item) => {
            res.push({
                name: item.metadata.name,
                namespace: item.metadata.namespace,
                type: item.spec.type,
                ports: item.spec.ports
            });
        });
        return { statusCode: response.statusCode, body: res };
    } catch (err) {
        logger.error(`KubeUtils :: Fetching All Services for Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
        return err;
    }
}


e.getService = async (data) => {
    logger.debug(`KubeUtils :: Fetch Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace}`);
    try {
        let response = await req.get(BASE_URL + "/namespaces/" + data.namespace + "/services/" + data.name);
        logger.trace(`KubeUtils :: Fetch Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
        return { statusCode: response.statusCode, body: response.body };
    } catch (err) {
        logger.error(`KubeUtils :: Fetch Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
        return err;
    }
}


e.createService = async (data) => {
    logger.debug(`KubeUtils :: Create Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace}`);
    try {
        let payload = {
            "metadata": {
                "name": data.name,
                "namespace": data.namespace
            },
            "spec": {
                "type": "ClusterIP",
                "selector": {
                    "app": data.selector
                },
                "ports": [
                    {
                        "protocol": "TCP",
                        "port": 80,
                        "targetPort": data.port
                    }
                ]
            }
        };
        logger.trace(`KubeUtils :: Creating Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Request Data :: ${JSON.stringify(payload)}`);
        let response = await req.post(BASE_URL + "/namespaces/" + data.namespace + "/services", payload);
        logger.trace(`KubeUtils :: Create Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
        return { statusCode: response.statusCode, body: response.body };
    } catch (err) {
        logger.error(`KubeUtils :: Create Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
        return err;
    }
}


e.updateService = async (data) => {
    logger.debug(`KubeUtils :: Update Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace}`);
    try {
        let payload = {
            "spec": {
                "type": "ClusterIP",
                "selector": {
                    "app": data.selector
                },
                "ports": [
                    {
                        "protocol": "TCP",
                        "port": 80,
                        "targetPort": data.port
                    }
                ]
            }
        };
        logger.trace(`KubeUtils :: Updating Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Request Data :: ${JSON.stringify(payload)}`);
        let response = await req.patch(BASE_URL + "/namespaces/" + data.namespace + "/services/" + data.name, payload);
        logger.trace(`KubeUtils :: Update Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
        return { statusCode: response.statusCode, body: response.body };
    } catch (err) {
        logger.error(`KubeUtils :: Update Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
        return err;
    }
}


e.deleteService = async (data) => {
    logger.debug(`KubeUtils :: Delete Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace}`);
    try {
        let payload = {};
        let response = await req.delete(BASE_URL + "/namespaces/" + data.namespace + "/services/" + data.name, payload)
        logger.trace(`KubeUtils :: Delete Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
        return { statusCode: response.statusCode, body: response.body };
    } catch (err) {
        logger.error(`KubeUtils :: Delete Service :: Service Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
        return err;
    }
}


module.exports = e;