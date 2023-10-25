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

// let response = {
// 	statusCode: 200,
// 	body: null
// };

e.get = async (url) => {
	try {
		let response = await got.get(`${URL}${url}`, {
			headers: headers,
			https: {
				rejectUnauthorized: false
			},
		});
		return response;
	} catch (error) {
		logger.error(error);
		return error;
	}
};

e.post = async (url, body) => {
	try {
		let response = await got.post(`${URL}${url}`, {
			headers: headers,
			https: {
				rejectUnauthorized: false
			},
			json: body
		});
		return response;
	} catch (error) {
		logger.error(error);
		return error;
	}
}

e.patch = async (url, body) => {
	try {
		let response = await got.patch(`${URL}${url}`, {
			headers: {
				"Authorization": "Bearer " + dataStack_token,
				"Content-Type": "application/merge-patch+json"
			},
			json: body
		});
		return response;
	} catch (error) {
		logger.error(error);
		return error;
	}
}

e.put = async (url, body) => {
	try {
		let response = await got.put(`${URL}${url}`, {
			headers: headers,
			https: {
				rejectUnauthorized: false
			},
			json: body
		});
		return response;
	} catch (error) {
		logger.error(error);
		return error;
	}
}

e.delete = async (url, body) => {
	try {
		let response = await got.delete(`${URL}${url}`, {
			headers: headers,
			https: {
				rejectUnauthorized: false
			},
			json: body
		});
		return response;
	} catch (error) {
		logger.error(error);
		return error;
	}
}

module.exports = e;