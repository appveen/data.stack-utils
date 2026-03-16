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

const TOKEN_REFRESH_BUFFER_SECONDS = 300;
let tokenRefreshTimer = null;

// if (fs.existsSync(dataStack_sa_path)) dataStack_token = fs.readFileSync(dataStack_sa_path);

const headers = {
	"Authorization": "Bearer " + dataStack_token
};

function decodeTokenExpiry(token) {
    try {
        const payload = token.split('.')[1];
        const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
        return decoded.exp || 0;
    } catch (err) {
        logger.error('KubeUtils :: Failed to decode token expiry', err.message);
        return 0;
    }
}

function loadToken() {
    try {
        if (!fs.existsSync(dataStack_sa_path)) {
            logger.error('KubeUtils :: Token file not found');
            return;
        }

        const newToken = fs.readFileSync(dataStack_sa_path, 'utf8').trim();
        if (newToken === dataStack_token) {
            logger.trace('KubeUtils :: Token unchanged, skipping refresh');
            return;
        }

        dataStack_token = newToken;
        headers['Authorization'] = 'Bearer ' + dataStack_token;

        const exp = decodeTokenExpiry(dataStack_token);
        if (exp) {
            const now = Math.floor(Date.now() / 1000);
            const refreshInSeconds = Math.max(exp - now - TOKEN_REFRESH_BUFFER_SECONDS, 60);

            logger.info(`KubeUtils :: Token loaded :: Expires at ${new Date(exp * 1000).toISOString()} :: Refresh in ${refreshInSeconds}s`);

            if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
            tokenRefreshTimer = setTimeout(loadToken, refreshInSeconds * 1000);
        } else {
            logger.warn('KubeUtils :: Could not determine token expiry, will refresh in 1 hour');
            if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
            tokenRefreshTimer = setTimeout(loadToken, 3600 * 1000);
        }
    } catch (err) {
        logger.error('KubeUtils :: Error loading token', err.message);
        // Retry in 60 seconds on failure
        if (tokenRefreshTimer) clearTimeout(tokenRefreshTimer);
        tokenRefreshTimer = setTimeout(loadToken, 60 * 1000);
    }
}

// Initial load
loadToken();

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
				...headers,
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
