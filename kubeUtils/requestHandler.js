"use strict"

const fs = require("fs");
const https = require('https');
const axios = require('axios');


let logger = global.logger;
if (!logger) {
	logger = {
		info: console.log,
		error: console.log,
		debug: console.log,
		trace: console.log
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


var e = {};


e.get = async (url) => {
	try {
		logger.trace(`Kubeutils :: Request Handler :: GET :: URL :: ${url}`);

		let api = `${URL}${url}`;
		let response = await axios({
			url: api,
			method: 'GET',
			headers: headers,
			httpsAgent: agent
		});

		logger.trace(`Kubeutils :: Request Handler :: GET :: Response`);
		logger.trace(response);
		
		return { statusCode: response.statusCode || response.status, body: response.body || response.data };
	} catch (error) {
		logger.error(`Kubeutils :: Request Handler :: GET :: Error`);
		logger.error(error);

		return error;
	}
};


e.post = async (url, body) => {
	try {
		logger.trace(`Kubeutils :: Request Handler :: POST :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);
		
		let api = `${URL}${url}`;
		let response = await axios({
			url: api,
			method: 'POST',
			headers: headers,
			httpsAgent: agent,
			data: body
		});

		logger.trace(`Kubeutils :: Request Handler :: POST :: Response`);
		logger.trace(response);

		return { statusCode: response.statusCode || response.status, body: response.body || response.data };
	} catch (error) {
		logger.error(`Kubeutils :: Request Handler :: POST :: Error`);
		logger.error(error);

		return error;
	}
}


e.patch = async (url, body) => {
	try {
		logger.trace(`Kubeutils :: Request Handler :: PATCH :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);

		let api = `${URL}${url}`;
		let response = await axios({
			url: api,
			method: 'PATCH',
			httpsAgent: agent,
			headers: {
				"Authorization": "Bearer " + dataStack_token,
				"Content-Type": "application/merge-patch+json"
			},
			data: body
		});

		logger.trace(`Kubeutils :: Request Handler :: PATCH :: Response`);
		logger.trace(response);

		return { statusCode: response.statusCode || response.status, body: response.body || response.data };
	} catch (error) {
		logger.error(`Kubeutils :: Request Handler :: PATCH :: Error`);
		logger.error(error);

		return error;
	}
}


e.put = async (url, body) => {
	try {
		logger.trace(`Kubeutils :: Request Handler :: PUT :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);

		let api = `${URL}${url}`;
		let response = await axios({
			url: api,
			method: 'PUT',
			headers: headers,
			httpsAgent: agent,
			data: body
		});

		logger.trace(`Kubeutils :: Request Handler :: PUT :: Response`);
		logger.trace(response);

		return { statusCode: response.statusCode || response.status, body: response.body || response.data };
	} catch (error) {
		logger.error(`Kubeutils :: Request Handler :: PUT :: Error`);
		logger.error(error);

		return error;
	}
}


e.delete = async (url, body) => {
	try {
		logger.trace(`Kubeutils :: Request Handler :: DELETE :: URL :: ${url} :: Body :: ${JSON.stringify(body)}`);

		let api = `${URL}${url}`;
		let response = await axios({
			url: api,
			method: 'DELETE',
			headers: headers,
			httpsAgent: agent,
			data: body
		});
		
		logger.trace(`Kubeutils :: Request Handler :: DELETE :: Response`);
		logger.trace(response);

		return { statusCode: response.statusCode || response.status, body: response.body || response.data };
	} catch (error) {
		logger.error(`Kubeutils :: Request Handler :: DELETE :: Error`);
		logger.error(error);

		return error;
	}
}


module.exports = e;
