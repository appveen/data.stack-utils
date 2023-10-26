"use strict"

const req = require("./requestHandler");

const _baseURL = "/apis/apps/v1";

let logger = global.logger;

if (!logger) {
	logger = {
		info: console.log,
		error: console.log,
		debug: console.log
	};
}

var e = {};

e.getAllServices = () => {
	logger.debug('KubeUtils :: fetching all services');
	return req.get(_baseURL + "/services")
		.then(_d => {
			logger.trace(`KubeUtils :: fetching all services :: response :: ${JSON.stringify(_d)}`);
			if (!(_d.statusCode >= 200 && _d.statusCode < 400)) throw new Error(_d.body && typeof _d.body === 'object' ? JSON.stringify(_d.body) : 'API returned ' + _d.statusCode)
			var data = _d.body;
			var res = []
			data.items.forEach(_i => res.push({
				name: _i.metadata.name,
				namespace: _i.metadata.namespace,
				type: _i.spec.type
			}));
			return res;
		}, _e => {
			logger.error(`KubeUtils :: fetching all services :: error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}

e.getAllServicesForNamespace = (_namespace) => {
	logger.debug(`KubeUtils :: fetching all services for namespace :: ${_namespace}`);
	return req.get(_baseURL + "/namespaces/" + _namespace + "/services")
		.then(_d => {
			logger.trace(`KubeUtils :: fetching all services for namespace :: ${_namespace} :: response :: ${JSON.stringify(_d)}`);
			if (!(_d.statusCode >= 200 && _d.statusCode < 400)) throw new Error(_d.body && typeof _d.body === 'object' ? JSON.stringify(_d.body) : 'API returned ' + _d.statusCode)
			var data = _d.body;
			var res = [];
			data.items.forEach(_i => res.push({
				name: _i.metadata.name,
				namespace: _i.metadata.namespace,
				type: _i.spec.type,
				ports: _i.spec.ports
			}));
			return res;
		}, _e => {
			logger.error(`KubeUtils :: fetching all services for namespace :: ${_namespace} :: error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}

e.getService = (_namespace, _name) => {
	logger.debug(`KubeUtils :: fetching service :: service name :: ${_name} :: namespace :: ${_namespace}`);
	return req.get(_baseURL + "/namespaces/" + _namespace + "/services/" + _name)
		.then(_d => {
			logger.trace(`KubeUtils :: fetching service :: service name :: ${_name} :: namespace :: ${_namespace} :: response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: fetching service :: service name :: ${_name} :: namespace :: ${_namespace} :: error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}

e.createService = (_namespace, _name, _port, _release) => {
	logger.debug(`KubeUtils :: creating service :: service name :: ${_name} :: namespace :: ${_namespace}`);
	var data = {
		"metadata": {
			"name": _name,
			"namespace": _namespace
		},
		"spec": {
			"type": "ClusterIP",
			"selector": {
				"app": _name
			},
			"ports": [
				{
					"protocol": "TCP",
					"port": 80,
					"targetPort": _port
				}
			]
		}
	};
	logger.trace(`KubeUtils :: creating service :: service name :: ${_name} :: namespace :: ${_namespace} :: data :: ${JSON.stringify(data)}`);
	return req.post(_baseURL + "/namespaces/" + _namespace + "/services", data)
		.then(_d => {
			logger.trace(`KubeUtils :: creating service :: service name :: ${_name} :: namespace :: ${_namespace} :: response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: creating service :: service name :: ${_name} :: namespace :: ${_namespace} :: error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}

e.deleteService = (_namespace, _name) => {
	logger.debug(`KubeUtils :: delete service :: service name :: ${_name} :: namespace :: ${_namespace}`);
	var data = {};
	return req.delete(_baseURL + "/namespaces/" + _namespace + "/services/" + _name, data)
		.then(_d => {
			logger.trace(`KubeUtils :: delete service :: service name :: ${_name} :: namespace :: ${_namespace} :: response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: delete service :: service name :: ${_name} :: namespace :: ${_namespace} :: error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}

module.exports = e;
