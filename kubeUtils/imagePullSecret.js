let e = {};

const req = require("./requestHandler");

const _baseURL = "/api/v1";

function base64_encode(data) {
    return new Buffer(data).toString('base64');
}

e.createSecret = (ns) => {
    console.log("Creating a new secret :: in ", ns);
    let dockerConfig = {
        "auths": { [process.env.DOCKER_REGISTRY_SERVER]: { username: process.env.DOCKER_USER, password: process.env.DOCKER_PASSWORD, email: process.env.DOCKER_EMAIL, auth:  base64_encode(`${process.env.DOCKER_USER}:${process.env.DOCKER_PASSWORD}`)} }
    }
    let base64En = base64_encode(JSON.stringify(dockerConfig));
    var data = {
        "kind": "Secret",
        "apiVersion": "v1",
        "metadata": {
            "name": "regsecret",
            "namespace": ns
        },
        "data": {
            ".dockerconfigjson": base64En
        },
        "type": "kubernetes.io/dockerconfigjson"
    };
    return req.post(_baseURL + "/namespaces/" + ns + "/secrets", data)
        .then(_d => {
            return data;
        }, _e => {
            console.log("ERR::",_e);
            return new Error(_e);
        });
}


module.exports = e;