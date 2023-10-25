"use strict"

var e = {};

const got = require('got');
const fs = require("fs");

let logger = global.logger;

if (!logger) {
	logger = {
		info: console.log,
		error: console.log,
		debug: console.log
	};
}

const URL = "https://kubernetes.default.svc";

var dataStack_token = "";
let dataStack_sa_path = "/var/run/secrets/kubernetes.io/serviceaccount/token";
if (fs.existsSync(dataStack_sa_path)) dataStack_token = fs.readFileSync(dataStack_sa_path);

const headers = {
	"Authorization": "Bearer " + dataStack_token
};

let response = {
	statusCode: 200,
	body: null
};

e.get = async (url) => {
	try {
		await got.get(`${URL}${url}`, {
			headers: headers
		}).json()
			.then(data => response.body = data)
	} catch (error) {
		logger.error(error);
		response.statusCode = 400;
	}
	return response;
};

e.post = async (url, body) => {
	try {
		await got.post(`${URL}${url}`, {
			headers: headers,
			json: body
		}).json()
			.then(data => response.body = data)
	} catch (error) {
		logger.error(error);
		response.statusCode = 400;
	}
	return response;
}

e.patch = async (url, body) => {
	try {
		await got.patch(`${URL}${url}`, {
			headers: {
				"Authorization": "Bearer " + dataStack_token,
				"Content-Type": "application/merge-patch+json"
			},
			json: body
		}).then(data => response.body = data.body);
	} catch (error) {
		logger.error(error);
		response.statusCode = 400;
	}
	return response;
}

e.put = async (url, body) => {
	try {
		await got.put(`${URL}${url}`, {
			headers: headers,
			json: body
		}).json().then(data => response.body = data);
	} catch (error) {
		logger.error(error);
		response.statusCode = 400;
	}
	return response.body;
}

e.delete = async (url, body) => {
	try {
		await got.delete(`${URL}${url}`, {
			headers: headers,
			json: body
		}).then(data => response.body = data.body);
	} catch (error) {
		logger.error(error);
		response.statusCode = 400;
	}
	return response.body;
}

module.exports = e;