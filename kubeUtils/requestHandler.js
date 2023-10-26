"use strict"

var e = {};

const https = require('https');
const got = require('got');
const axios = require('axios');
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

const agent = new https.Agent({
	rejectUnauthorized: false,
});

// let response = {
// 	statusCode: 200,
// 	body: null
// };

e.get = async (url) => {
	try {
		logger.debug(`Kubeutils :: Request Handler :: GET :: URL :: ${url}`);
		let response = await axios({
			url: `${URL}${url}`,
			method: 'GET',
			headers: headers,
			responseType: 'json',
			httpsAgent: agent,
			// validateStatus: function (status) {
			// 	return true;
			// },
			// throwHttpErrors: false,
			// https: {
			// 	rejectUnauthorized: false
			// },
		});
		logger.debug(`Kubeutils :: Request Handler :: GET :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (error) {
		logger.debug(`Kubeutils :: Request Handler :: GET :: Error :: ${JSON.stringify(error)}`);
		return error;
	}
};

e.post = async (url, body) => {
	try {
		logger.debug(`Kubeutils :: Request Handler :: POST :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);
		let response = await axios({
			url: `${URL}${url}`,
			method: 'POST',
			headers: headers,
			responseType: 'json',
			httpsAgent: agent,
			// validateStatus: function (status) {
			// 	return true;
			// },
			// throwHttpErrors: false,z
			data: body
		});
		logger.debug(`Kubeutils :: Request Handler :: POST :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (error) {
		logger.debug(`Kubeutils :: Request Handler :: POST :: Error :: ${JSON.stringify(error)}`);
		return error;
	}
}

e.patch = async (url, body) => {
	try {
		logger.debug(`Kubeutils :: Request Handler :: PATCH :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);
		let response = await axios({
			url: `${URL}${url}`,
			method: 'PATCH',
			responseType: 'json',
			// throwHttpErrors: false,
			httpsAgent: agent,
			// validateStatus: function (status) {
			// 	return true;
			// },
			headers: {
				"Authorization": "Bearer " + dataStack_token,
				"Content-Type": "application/merge-patch+json"
			},
			// headers: headers,
			data: body
		});
		logger.debug(`Kubeutils :: Request Handler :: PATCH :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (error) {
		logger.debug(`Kubeutils :: Request Handler :: PATCH :: Error :: ${JSON.stringify(error)}`);
		return error;
	}
}

e.put = async (url, body) => {
	try {
		logger.debug(`Kubeutils :: Request Handler :: PUT :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);
		let response = await axios({
			url: `${URL}${url}`,
			method: 'PUT',
			headers: headers,
			// throwHttpErrors: false,
			responseType: 'json',
			httpsAgent: agent,
			// validateStatus: function (status) {
			// 	return true;
			// },
			// https: {
			// 	rejectUnauthorized: false
			// },
			data: body
		});
		logger.debug(`Kubeutils :: Request Handler :: PUT :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (error) {
		logger.debug(`Kubeutils :: Request Handler :: PUT :: Error :: ${JSON.stringify(error)}`);
		return error;
	}
}

e.delete = async (url, body) => {
	try {
		logger.debug(`Kubeutils :: Request Handler :: DELETE :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);
		let response = await axios({
			url: `${URL}${url}`,
			method: 'DELETE',
			headers: headers,
			// throwHttpErrors: false,
			responseType: 'json',
			httpsAgent: agent,
			// validateStatus: function (status) {
			// 	return true;
			// },
			// https: {
			// 	rejectUnauthorized: false
			// },
			data: body
		});
		logger.debug(`Kubeutils :: Request Handler :: DELETE :: Response :: ${JSON.stringify(response)}`);
		return { statusCode: response.statusCode, body: response.body };
	} catch (error) {
		logger.debug(`Kubeutils :: Request Handler :: DELETE :: Error :: ${JSON.stringify(error)}`);
		return error;
	}
}

module.exports = e;