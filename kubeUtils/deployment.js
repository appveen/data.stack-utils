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

const _baseURL = "/apis/apps/v1";
var e = {};


e.getAllDeployments = () => {
	logger.debug('KubeUtils :: Fetching All Deployments');

	return req.get(_baseURL + "/deployments")
		.then(_d => {
			logger.trace(`KubeUtils :: Fetching All Deployments :: Response :: ${JSON.stringify(_d)}`);

			if (!(_d.statusCode >= 200 && _d.statusCode < 400)) throw new Error(_d.body && typeof _d.body === 'object' ? JSON.stringify(_d.body) : 'API returned ' + _d.statusCode)
			var data = _d.body;
			var res = []
			data.items.forEach(_i => res.push({
				name: _i.metadata.name,
				namespace: _i.metadata.namespace,
				status: _i.status.conditions[0].type
			}));

			return res;
		}, _e => {
			logger.error(`KubeUtils :: Fetching All Deployments :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.getAllDeploymentsForNamespace = (_namespace) => {
	logger.debug(`KubeUtils :: Fetching All Deployments for Namespace :: ${_namespace}`);

	return req.get(_baseURL + "/namespaces/" + _namespace + "/deployments")
		.then(_d => {
			logger.trace(`KubeUtils :: Fetching All Deployments for Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);

			if (!(_d.statusCode >= 200 && _d.statusCode < 400)) throw new Error(_d.body && typeof _d.body === 'object' ? JSON.stringify(_d.body) : 'API returned ' + _d.statusCode)
			var data = _d.body;
			var res = []
			data.items.forEach(_i => res.push({
				name: _i.metadata.name,
				namespace: _i.metadata.namespace,
				status: _i.status.conditions[0].type
			}));

			return res;
		}, _e => {
			logger.error(`KubeUtils :: Fetching All Deployments for Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.getDeployment = (_namespace, _name) => {
	logger.debug(`KubeUtils :: Fetching Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace}`);

	return req.get(_baseURL + "/namespaces/" + _namespace + "/deployments/" + _name)
		.then(_d => {
			logger.trace(`KubeUtils :: Fetching Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Fetching Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.createDeployment = (_namespace, _name, _image, _port, _envVars, _options, _release, _volumeMounts, _envFrom) => {
	logger.debug(`KubeUtils :: Creating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace}`);

	var data = {
		"metadata": {
			"name": _name,
			"namespace": _namespace
		},
		"spec": {
			"replicas": 1,
			"selector": {
				"matchLabels": {
					"app": _name
				}
			},
			"template": {
				"metadata": {
					"labels": {
						"app": _name
					}
				},
				"spec": {
					"containers": [
						{
							"name": _name,
							"image": _image,
							"ports": [
								{
									"containerPort": _port
								}
							],
							"env": _envVars
						}
					]
				}
			}
		}
	};
	if (process.env.DOCKER_USER && process.env.DOCKER_PASSWORD && process.env.DOCKER_REGISTRY_SERVER && process.env.DOCKER_EMAIL) {
		data.spec.template.spec.imagePullSecrets = [{ name: 'regsecret' }];
	}
	if (_options.livenessProbe) data.spec.template.spec.containers[0]["livenessProbe"] = _options.livenessProbe;
	if (_options.readinessProbe) data.spec.template.spec.containers[0]["readinessProbe"] = _options.readinessProbe;
	if (_options.startupProbe) data.spec.template.spec.containers[0]["startupProbe"] = _options.startupProbe;
	if (_volumeMounts) {
		data.spec.template.spec.containers[0]["volumeMounts"] = [];
		data.spec.template.spec["volumes"] = [];
		for (var mount in _volumeMounts) {
			let tempVolumeConfig = {
				"name": mount
			};
			data.spec.template.spec.containers[0]["volumeMounts"].push({
				"name": mount,
				"mountPath": _volumeMounts[mount]["containerPath"]
			});
			if (!_volumeMounts[mount].mountType || _volumeMounts[mount].mountType == 'HOSTPATH') {
				tempVolumeConfig["hostPath"] = { "path": _volumeMounts[mount]["hostPath"] };
			} else {
				tempVolumeConfig["persistentVolumeClaim"] = { "claimName": _volumeMounts[mount]["hostPath"] };
			}
			data.spec.template.spec["volumes"].push(tempVolumeConfig);
		}
	}
	if (_envFrom) {
		data.spec.template.spec.containers[0].envFrom = [];
		_envFrom.forEach(item => {
			if (item.type == 'secret') {
				data.spec.template.spec.containers[0].envFrom.push({
					secretRef: {
						name: item.name
					}
				});
			}
		});
	}

	logger.trace(`KubeUtils :: Creating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Request Data :: ${JSON.stringify(data)}`);

	return req.post(_baseURL + "/namespaces/" + _namespace + "/deployments", data)
		.then(_d => {
			logger.trace(`KubeUtils :: Creating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Creating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.updateDeployment = (_namespace, _name, _image, _port, _envVars, _options, _volumeMounts, _envFrom) => {
	logger.debug(`KubeUtils :: Updating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace}`);

	var data = {
		"spec": {
			"template": {
				"spec": {
					"containers": [
						{
							"image": _image,
							"name": _name,
							"ports": [
								{
									"containerPort": _port
								}
							],
							"env": _envVars
						}
					]
				}
			}
		}
	};
	if (process.env.DOCKER_USER && process.env.DOCKER_PASSWORD && process.env.DOCKER_REGISTRY_SERVER && process.env.DOCKER_EMAIL) {
		data.spec.template.spec.imagePullSecrets = [{ name: 'regsecret' }];
	}
	if (_options.livenessProbe) data.spec.template.spec.containers[0]["livenessProbe"] = _options.livenessProbe;
	if (_options.readinessProbe) data.spec.template.spec.containers[0]["readinessProbe"] = _options.readinessProbe;
	if (_options.startupProbe) data.spec.template.spec.containers[0]["startupProbe"] = _options.startupProbe;
	if (_volumeMounts) {
		data.spec.template.spec.containers[0]["volumeMounts"] = [];
		data.spec.template.spec["volumes"] = [];
		for (var mount in _volumeMounts) {
			let tempVolumeConfig = {
				"name": mount
			};
			data.spec.template.spec.containers[0]["volumeMounts"].push({
				"name": mount,
				"mountPath": _volumeMounts[mount]["containerPath"]
			});
			if (!_volumeMounts[mount].mountType || _volumeMounts[mount].mountType == 'HOSTPATH') {
				tempVolumeConfig["hostPath"] = { "path": _volumeMounts[mount]["hostPath"] };
			} else {
				tempVolumeConfig["persistentVolumeClaim"] = { "claimName": _volumeMounts[mount]["hostPath"] };
			}
			data.spec.template.spec["volumes"].push(tempVolumeConfig);
		}
	}
	if (_envFrom) {
		data.spec.template.spec.containers[0].envFrom = [];
		_envFrom.forEach(item => {
			if (item.type == 'secret') {
				data.spec.template.spec.containers[0].envFrom.push({
					secretRef: {
						name: item.name
					}
				});
			}
		});
	}
	logger.trace(`KubeUtils :: Updating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Request Data :: ${JSON.stringify(data)}`);
	return req.patch(_baseURL + "/namespaces/" + _namespace + "/deployments/" + _name, data)
		.then(_d => {
			logger.trace(`KubeUtils :: Updating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Updating Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.deleteDeployment = (_namespace, _name) => {
	logger.debug(`KubeUtils :: Delete Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace}`);

	var data = {};
	return req.delete(_baseURL + "/namespaces/" + _namespace + "/deployments/" + _name, data)
		.then(_d => {
			logger.trace(`KubeUtils :: Delete Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Delete Deployment :: Deployment Name :: ${_name} :: Namespace :: ${_namespace} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		});
}


e.scaleDeployment = (ns, name, scale) => {
	logger.debug(`KubeUtils :: Scale Deployment :: Deployment Name :: ${name} :: Namespace :: ${ns}`);

	let payload = {
		"kind": "Scale",
		"apiVersion": "autoscaling/v1",
		"metadata": {
			"name": name,
			"namespace": ns
		},
		"spec": {
			"replicas": scale
		}
	};
	
	return req.put(_baseURL + "/namespaces/" + ns + "/deployments/" + name + "/scale", payload)
		.then(_d => {
			logger.trace(`KubeUtils :: Scale Deployment :: Deployment Name :: ${name} :: Namespace :: ${ns} :: Response :: ${JSON.stringify(_d)}`);
			return _d;
		}, _e => {
			logger.error(`KubeUtils :: Scale Deployment :: Deployment Name :: ${name} :: Namespace :: ${ns} :: Error :: ${JSON.stringify(_e)}`);
			return _e;
		})
}


module.exports = e;
