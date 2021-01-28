"use strict"

var e = {};

const req = require('request');
const fs = require("fs");

const URL = "https://kubernetes.default.svc";

var odp_token = "";
let odp_sa_path = "/var/run/secrets/kubernetes.io/serviceaccount/token";
if(fs.existsSync(odp_sa_path)) odp_token = fs.readFileSync(odp_sa_path);

e.get = (_api) => {
	var options = {
		method: "GET",
		url: URL + _api,
		json: true,
		strictSSL: false,
		headers: {
			'Content-Type': 'application/json',
			"Authorization": "Bearer " + odp_token
		},
	}
	return new Promise((resolve, reject) => {
		req(options, function (err, res, body) {
			if (err) {
				return reject(err);
			}
			else {
				return resolve({ statusCode: res.statusCode, body: body });
			}
		})
	})
}

e.post = (_api, _body) => {
	var options = {
		method: "POST",
		url: URL + _api,
		strictSSL: false,
		headers: {
			'Content-Type': 'application/json',
			"Authorization": "Bearer " + odp_token
		},
		json: true,
		body: _body,
	}
	return new Promise((resolve, reject) => {
		req(options, function (err, res, body) {
			if (err) {
				return reject(err);
			}
			else {
				return resolve({ statusCode: res.statusCode, body: body });
			}
		})
	})
}

e.patch = (_api, _body) => {
	var options = {
		method: "PATCH",
		url: URL + _api,
		strictSSL: false,
		headers: {
			"Authorization": "Bearer " + odp_token,
			"Content-Type": "application/merge-patch+json"
		},
		json: true,
		body: _body
	}
	return new Promise((resolve, reject) => {
		req(options, function (err, res, body) {
			if (err) {
				return reject(err);
			}
			else {
				return resolve({ statusCode: res.statusCode, body: body });
			}
		})
	})
}

e.delete = (_api, _body) => {
	var options = {
		method: "DELETE",
		url: URL + _api,
		strictSSL: false,
		headers: {
			'Content-Type': 'application/json',
			"Authorization": "Bearer " + odp_token
		},
		json: true,
		body: _body
	}
	return new Promise((resolve, reject) => {
		req(options, function (err, res, body) {
			if (err) {
				return reject(err);
			}
			else {
				return resolve({ statusCode: res.statusCode, body: body });
			}
		})
	})
}

e.put = (_api, _body) => {
	var options = {
		method: "PUT",
		url: URL + _api,
		strictSSL: false,
		headers: {
			'Content-Type': 'application/json',
			"Authorization": "Bearer " + odp_token
		},
		json: true,
		body: _body
	}
	return new Promise((resolve, reject) => {
		req(options, function (err, res, body) {
			if (err) {
				return reject(err);
			}
			else {
				return resolve({ statusCode: res.statusCode, body: body });
			}
		})
	})
}

module.exports = e;