"user strict"

const child_process = require('child_process');

var e = {};

const registry = process.env.REGISTRY;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

function run(_cmd, _args){
	let stdout = "";
	let stderr = "";
	loginToRegistry().then(_ => {
		return new Promise((resolve, reject) => {
	    	var child = child_process.spawn(_cmd, _args);
		    
		    child.stdout.on('data', (data) => stdout += data);

			child.stderr.on('data', (data) => stderr += data);
		    
		    child.on('exit', function(e, code) {
		        if (e == 0) {
		        	resolve(stdout);
		        }
		        else {
		        	reject(stderr);
		        }
		    });
		});
	});
}

function loginToRegistry () {
	return run("aws", ["ecr", "get-login", "--no-include-email"])
	.then(_d => {
		let command = _d.trim().split(" ");
		let cmd = command.splice(0, 1);
		return run(cmd[0], command)
	});
}

e.pushImage = (_image) => {
	console.log("Pushing image to the docker registry...");
	return run("docker", ["push", registry + "/" + _image], {});
};

module.exports = e;