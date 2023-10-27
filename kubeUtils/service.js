"use strict"

const req = require("./requestHandler");


let logger = global.logger;
if (!logger) {
	logger = {
		info: console.log,
		error: console.log,
		debug: console.log
	};
}


const _baseURL = "/api/v1";
var e = {};


e.getAllServices = () => {
	logger.debug('KubeUtils :: Fetching All Services');

	return req.get(_baseURL + "/services")
		.then(_d => {
			logger.trace(`KubeUtils :: Fetching All Services :: Response :: ${JSON.stringify(_d)}`);

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
			logger.error(`KubeUtils :: Fetching All Services :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.getAllServicesForNamespace = (_namespace) => {
	logger.debug(`KubeUtils :: Fetching All Services for Namespace :: ${_namespace}`);

	return req.get(_baseURL + "/namespaces/" + _namespace + "/services")
		.then(_d => {
			logger.trace(`KubeUtils :: Fetching All Services for Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);

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
			logger.error(`KubeUtils :: Fetching All Services for Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.getService = (_namespace, _name) => {
	logger.debug(`KubeUtils :: Fetching Service :: Service Name :: ${_name} :: Namespace :: ${_namespace}`);

	return req.get(_baseURL + "/namespaces/" + _namespace + "/services/" + _name)
		.then(_d => {
			logger.trace(`KubeUtils :: Fetching Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Fetching Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.createService = (_namespace, _name, _port, _release) => {
	logger.debug(`KubeUtils :: Creating Service :: Service Name :: ${_name} :: Namespace :: ${_namespace}`);

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

	logger.trace(`KubeUtils :: Creating Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Request Data :: ${JSON.stringify(data)}`);
	
	return req.post(_baseURL + "/namespaces/" + _namespace + "/services", data)
		.then(_d => {
			logger.trace(`KubeUtils :: Creating Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Creating Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.deleteService = (_namespace, _name) => {
	logger.debug(`KubeUtils :: Delete Service :: Service Name :: ${_name} :: Namespace :: ${_namespace}`);

	var data = {};
	return req.delete(_baseURL + "/namespaces/" + _namespace + "/services/" + _name, data)
		.then(_d => {
			logger.trace(`KubeUtils :: Delete Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Delete Service :: Service Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


module.exports = e;
