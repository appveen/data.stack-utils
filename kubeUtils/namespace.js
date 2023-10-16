"use strict"

const req = require("./requestHandler");

const _baseURL = "/api/v1/namespaces";

var e = {};

e.getAllNamespaces = () => {
	return req.get(_baseURL)
		.then(_d => {
			if (!(_d.statusCode >= 200 && _d.statusCode < 400)) throw new Error(_d.body && typeof _d.body === 'object' ? JSON.stringify(_d.body) : 'API returned ' + _d.statusCode)
			var data = _d.body;
			var res = []
			data.items.forEach(_i => res.push({
				name: _i.metadata.name,
				status: _i.status.phase
			}));
			return res;
		});
}

e.getNamespace = (_name) => {
	return req.get(_baseURL + "/" + _name)
}

e.createNamespace = (_name) => {
	var data = { "metadata": { "name": _name } };
	return req.post(_baseURL, data)
}

e.deleteNamespace = (_name) => {
	var data = {};
	return req.delete(_baseURL + "/" + _name, data)
}

module.exports = e;