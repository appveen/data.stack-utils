"use strict"

const req = require("./requestHandler");

const _baseURL = "/apis/apps/v1";

var e = {};

e.getAllDeployments = () => {
	return req.get(_baseURL + "/deployments")
		.then(_d => {
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
			return _e;
		});
}

e.getAllDeploymentsForNamespace = (_namespace) => {
	return req.get(_baseURL + "/namespaces/" + _namespace + "/deployments")
		.then(_d => {
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
			return _e;
		});
}

e.getDeployment = (_namespace, _name) => {
	return req.get(_baseURL + "/namespaces/" + _namespace + "/deployments/" + _name)
		.then(_d => {
			return _d;
		});
}

e.createDeployment = (_namespace, _name, _image, _port, _envVars, _options,_release,_volumeMounts) => {
	var data = {
		"metadata": {
			"name": _name,
			"namespace": _namespace
		},
		"spec": {
			"replicas": 1,
			"selector": {
				"matchLabels": {
					"app": _name,
					"release": _release
				}
			},
			"template": {
				"metadata": {
					"labels": {
						"app": _name,
						"release": _release
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
	if (_volumeMounts){
		data.spec.template.spec.containers[0]["volumeMounts"] = [];
		data.spec.template.spec["volumes"] = [];
		for(var mount in _volumeMounts){
			data.spec.template.spec.containers[0]["volumeMounts"].push({
				"name" : mount,
				"mountPath" : _volumeMounts[mount]["containerPath"]
			});
			data.spec.template.spec["volumes"].push({
				"name": mount,
				"hostPath": {
					"path": _volumeMounts[mount]["hostPath"]
				}
			});
		}
	}
	return req.post(_baseURL + "/namespaces/" + _namespace + "/deployments", data)
		.then(_d => {
			return _d;
		}, _e => {
			return _e;
		});
}

e.updateDeployment = (_namespace, _name, _image, _port, _envVars, _options,_volumeMounts) => {
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
	if (_volumeMounts){
		data.spec.template.spec.containers[0]["volumeMounts"] = [];
		data.spec.template.spec["volumes"] = [];
		for(var mount in _volumeMounts){
			data.spec.template.spec.containers[0]["volumeMounts"].push({
				"name" : mount,
				"mountPath" : _volumeMounts[mount]["containerPath"]
			});
			data.spec.template.spec["volumes"].push({
				"name": mount,
				"hostPath": {
					"path": _volumeMounts[mount]["hostPath"]
				}
			});
		}
	}
	return req.patch(_baseURL + "/namespaces/" + _namespace + "/deployments/" + _name, data)
		.then(_d => {
			return _d;
		}, _e => {
			return _e;
		});
}

e.deleteDeployment = (_namespace, _name) => {
	var data = {};
	return req.delete(_baseURL + "/namespaces/" + _namespace + "/deployments/" + _name, data)
		.then(_d => {
			return _d;
		}, _e => {
			return _e;
		});
}

e.scaleDeployment = (ns, name, scale) => {
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
			return _d;
		}, _e => {
			return _e;
		})
}

e.getDeploymentScale = (ns, name) => {
	return req.get(_baseURL + "/namespaces/" + ns + "/deployments/" + name + "/scale", payload)
		.then(_d => {
			return _d;
		}, _e => {
			return _e;
		})
}

module.exports = e;
