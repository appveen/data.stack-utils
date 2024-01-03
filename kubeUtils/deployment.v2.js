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

const BASE_URL = "/apis/apps/v1";
const e = {};

function getErrorMessage(response) {
	if (response.body && typeof response.body === 'object') {
		return JSON.stringify(response.body);
	} else {
		return 'API returned ' + response.statusCode;
	}
}

e.getAllDeployments = async () => {
	logger.debug('KubeUtils :: Fetching All Deployments');
	try {
		let response = await req.get(BASE_URL + "/deployments");
		logger.trace(`KubeUtils :: Fetching All Deployments :: Response :: ${JSON.stringify(response)}`);
		if (!(response.statusCode >= 200 && response.statusCode < 400)) {
			throw new Error(getErrorMessage(response));
		}
		let data = response.body;
		let res = []
		data.items.forEach((item) => {
			res.push({
				name: item.metadata.name,
				namespace: item.metadata.namespace,
				status: item.status.conditions[0].type
			})
		});
		return { statusCode: response.statusCode, body: res };
	} catch (err) {
		logger.error(`KubeUtils :: Fetching All Deployments :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


e.getAllDeploymentsForNamespace = async (data) => {
	logger.debug(`KubeUtils :: Fetching All Deployments for Namespace :: ${data.namespace}`);
	try {
		let response = await req.get(BASE_URL + "/namespaces/" + data.namespace + "/deployments");
		logger.trace(`KubeUtils :: Fetching All Deployments for Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
		if (!(response.statusCode >= 200 && response.statusCode < 400)) {
			throw new Error(getErrorMessage(response));
		}
		let data = response.body;
		let res = []
		data.items.forEach((item) => {
			res.push({
				name: item.metadata.name,
				namespace: item.metadata.namespace,
				status: item.status.conditions[0].type
			})
		});
		return { statusCode: response.statusCode, body: res };
	} catch (err) {
		logger.error(`KubeUtils :: Fetching All Deployments for Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


e.getDeployment = async (data) => {
	logger.debug(`KubeUtils :: Fetching Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace}`);
	try {
		let response = await req.get(BASE_URL + "/namespaces/" + data.namespace + "/deployments/" + data.name);
		logger.trace(`KubeUtils :: Fetching Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (err) {
		logger.error(`KubeUtils :: Fetching Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


e.createDeployment = async (data) => {
	logger.debug(`KubeUtils :: Creating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace}`);
	try {
		let payload = {
			"metadata": {
				"name": data.name,
				"namespace": data.namespace
			},
			"spec": {
				"replicas": 1,
				"selector": {
					"matchLabels": {
						"app": data.name
					}
				},
				"template": {
					"metadata": {
						"labels": {
							"app": data.name
						}
					},
					"spec": {
						"containers": [
							{
								"name": data.name,
								"image": data.image,
								"ports": [
									{
										"containerPort": data.port
									}
								],
								"env": data.envVars
							}
						]
					}
				}
			}
		};
		if (process.env.DOCKER_USER && process.env.DOCKER_PASSWORD && process.env.DOCKER_REGISTRY_SERVER && process.env.DOCKER_EMAIL) {
			payload.spec.template.spec.imagePullSecrets = [{ name: 'regsecret' }];
		}
		if (data.livenessProbe) payload.spec.template.spec.containers[0]["livenessProbe"] = data.livenessProbe;
		if (data.readinessProbe) payload.spec.template.spec.containers[0]["readinessProbe"] = data.readinessProbe;
		if (data.startupProbe) payload.spec.template.spec.containers[0]["startupProbe"] = data.startupProbe;
		if (data.volumeMounts) {
			payload.spec.template.spec.containers[0]["volumeMounts"] = [];
			payload.spec.template.spec["volumes"] = [];
			for (let mount in data.volumeMounts) {
				let tempVolumeConfig = {
					"name": mount
				};
				payload.spec.template.spec.containers[0]["volumeMounts"].push({
					"name": mount,
					"mountPath": data.volumeMounts[mount]["containerPath"]
				});
				if (!data.volumeMounts[mount].mountType || data.volumeMounts[mount].mountType == 'HOSTPATH') {
					tempVolumeConfig["hostPath"] = { "path": data.volumeMounts[mount]["hostPath"] };
				} else {
					tempVolumeConfig["persistentVolumeClaim"] = { "claimName": data.volumeMounts[mount]["hostPath"] };
				}
				payload.spec.template.spec["volumes"].push(tempVolumeConfig);
			}
		}
		if (data.envFrom) {
			payload.spec.template.spec.containers[0].envFrom = [];
			data.envFrom.forEach(item => {
				if (item.type == 'secret') {
					payload.spec.template.spec.containers[0].envFrom.push({
						secretRef: {
							name: item.name
						}
					});
				}
			});
		}

		logger.trace(`KubeUtils :: Creating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Request Data :: ${JSON.stringify(payload)}`);
		let response = await req.post(BASE_URL + "/namespaces/" + data.namespace + "/deployments", payload);
		logger.trace(`KubeUtils :: Creating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (err) {
		logger.error(`KubeUtils :: Creating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


e.updateDeployment = async (data) => {
	logger.debug(`KubeUtils :: Updating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace}`);
	try {
		let payload = {
			"spec": {
				"template": {
					"spec": {
						"containers": [
							{
								"image": data.image,
								"name": data.name,
								"ports": [
									{
										"containerPort": data.port
									}
								],
								"env": data.envVars
							}
						]
					}
				}
			}
		};

		if (process.env.DOCKER_USER && process.env.DOCKER_PASSWORD && process.env.DOCKER_REGISTRY_SERVER && process.env.DOCKER_EMAIL) {
			payload.spec.template.spec.imagePullSecrets = [{ name: 'regsecret' }];
		}
		if (data.livenessProbe) payload.spec.template.spec.containers[0]["livenessProbe"] = data.livenessProbe;
		if (data.readinessProbe) payload.spec.template.spec.containers[0]["readinessProbe"] = data.readinessProbe;
		if (data.startupProbe) payload.spec.template.spec.containers[0]["startupProbe"] = data.startupProbe;
		if (data.volumeMounts) {
			payload.spec.template.spec.containers[0]["volumeMounts"] = [];
			payload.spec.template.spec["volumes"] = [];
			for (let mount in data.volumeMounts) {
				let tempVolumeConfig = {
					"name": mount
				};
				payload.spec.template.spec.containers[0]["volumeMounts"].push({
					"name": mount,
					"mountPath": data.volumeMounts[mount]["containerPath"]
				});
				if (!data.volumeMounts[mount].mountType || data.volumeMounts[mount].mountType == 'HOSTPATH') {
					tempVolumeConfig["hostPath"] = { "path": data.volumeMounts[mount]["hostPath"] };
				} else {
					tempVolumeConfig["persistentVolumeClaim"] = { "claimName": data.volumeMounts[mount]["hostPath"] };
				}
				payload.spec.template.spec["volumes"].push(tempVolumeConfig);
			}
		}
		if (data.envFrom) {
			payload.spec.template.spec.containers[0].envFrom = [];
			data.envFrom.forEach(item => {
				if (item.type == 'secret') {
					payload.spec.template.spec.containers[0].envFrom.push({
						secretRef: {
							name: item.name
						}
					});
				}
			});
		}

		logger.trace(`KubeUtils :: Updating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Request Data :: ${JSON.stringify(payload)}`);
		let response = await req.patch(BASE_URL + "/namespaces/" + data.namespace + "/deployments/" + data.name, payload);
		logger.trace(`KubeUtils :: Updating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (err) {
		logger.error(`KubeUtils :: Updating Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


e.deleteDeployment = async (data) => {
	logger.debug(`KubeUtils :: Delete Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace}`);
	try {
		let payload = {};
		let response = await req.delete(BASE_URL + "/namespaces/" + data.namespace + "/deployments/" + data.name, payload);
		logger.trace(`KubeUtils :: Delete Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (err) {
		logger.error(`KubeUtils :: Delete Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


e.scaleDeployment = async (data) => {
	logger.debug(`KubeUtils :: Scale Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace}`);
	try {
		let payload = {
			"kind": "Scale",
			"apiVersion": "autoscaling/v1",
			"metadata": {
				"name": data.name,
				"namespace": data.namespace
			},
			"spec": {
				"replicas": data.scale
			}
		};
		let response = await req.put(BASE_URL + "/namespaces/" + data.namespace + "/deployments/" + data.name + "/scale", payload);
		logger.trace(`KubeUtils :: Scale Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (err) {
		logger.error(`KubeUtils :: Scale Deployment :: Deployment Name :: ${data.name} :: Namespace :: ${data.namespace} :: Error :: ${JSON.stringify(err)}`);
		return err;
	}
}


module.exports = e;
