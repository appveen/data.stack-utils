# data.stack-utils
Common utils for appveen data.stack

## Audit Trail
This lib contain hooks to create audit logs in a specific DB. This DB will store all the logs of data change.

To store the logs, the node service should invoke the following hooks provided by the lib.

1. getAuditPreSaveHook: This will return hook for pre save. collectionName(where the document is stored) has to be passed as an argument.

2. getAuditPostSaveHook: This will return hook for post save. collectionName(where the audit log should be stored) has to be passed as an argument.

3. getAuditPreRemoveHook: This will return hook for pre remove. No argument needed.

4. getAuditPostRemoveHook: This will return hook for post remove. collectionName(where the audit log should be stored) has to be passed as an argument.

To record txnId and username in the audit log, one has to pass req object in the save method at the time of document creation. 

## KubeUtils: Kubernetes API and Docker Client

### Kubernetes APIs

The following Kubernetes services have been implemented

* Namespace
* Deployment
* Services

#### Setting up the environment

The following environment variables must be set, 

* MDM_KEY - User key file to be used for the Kubernetes connection.
* MDM_CRT - User certificate file to be used for the Kubernetes connection.
* KUBERNETES_SERVICE_HOST - Hostname/IP of the Kubernetes server.
* KUBERNETES_SERVICE_PORT - Port to access the Kubernetes server.

#### APIs

__Namespace__

```js
ns.getAllNamespaces()
ns.getNamespace("capiot")
ns.createNamespace("test")
ns.getAllNamespaces()
ns.deleteNamespace("test")
ns.getAllNamespaces()
```

__Deployment__

```js
deployment.getAllDeployments()
deployment.getAllDeploymentsForNamespace("capiot")
deployment.getDeployment("capiot", "x")
deployment.createDeployment("capiot", "x", "x:2", 8080, [{"name": "ENV_VAR", "value": "value"}])
deployment.updateDeployment("capiot", "x", "x:2");
deployment.deleteDeployment("capiot", "x");
```

__Service__

```js
service.getAllServices()
service.getAllServicesForNamespace("capiot").then(_d => console.log(_d)
service.getService("capiot", "x")
service.createService("capiot", "x", 20001)
service.updateService("capiot", "x", 8001)
service.getAllServicesForNamespace("capiot")
service.deleteService("capiot", "x");
```

## Docker

Only one API is exposed. This is to push the image into a private registry

### Setting-up the environment

* REGISTRY - The AWS ECR URL
* AWS_ACCESS_KEY_ID - AWS access key.
* AWS_SECRET_ACCESS_KEY - AWS secret
* AWS_DEFAULT_REGION - AWS region

### APIs

```js
docker.pushImage("mdm:x2")
```