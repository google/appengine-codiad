# IDE Proxy

In order to run the IDE instances for developers in a cloud project, there is an IDE proxy running
on the managed VM which routes the requests to the individual Codiad containers for each developer
based on their email. The IDE proxy is written in nodejs. It is responsible for creating a Codiad
container for a user as soon as they connect to the IDE. Thereafter all of the request coming from
that user will be forwarded to the respective container. The authentication is done through
appengine.

## Deploying to a Google Cloud project

The following tools must be installed on your system for deployment:
- docker
- make
- gcloud

In order to deploy Codiad to a Google Cloud project run the following command in this directory:

    make deploy PROJECT=<Google Cloud project id>

Make sure you already have a valid Google Cloud authentication token. If you don't have that, try:

    gcloud auth login
