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
	.then(_d => {
		return _d
	}, _e => {
		console.log("ERROR");
		console.log(_e.message);
	});
}

e.createNamespace = (_name,_release) => {
	var data = {"metadata": {"name": _name},"spec": {"selector": {"release" : _release}}};
	return req.post(_baseURL, data)
	.then(_d => {
		return _d;
	}, _e => {
		console.log("ERROR");
		console.log(_e.message);
	});
}

e.deleteNamespace = (_name) => {
	var data = {};
	return req.delete(_baseURL + "/" + _name, data)
	.then(_d => {
		return _d;
	}, _e => {
		console.log("ERROR");
		console.log(_e.message);
	});
}

e.editNameSpace = (_name,_release)=>{
	var data = {"metadata": {"name": _name},"spec": {"selector": {"release" : _release}}};
	return req.put(_baseURL + "/" + _name,data)
	.then(_d => {
		return _d
	}, _e => {
		console.log("ERROR");
		console.log(_e.message);
	});
}

module.exports = e;