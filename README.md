# Codiad Managed VMs Docker Image

This repo defines a Docker Image that can be used to run Codiad on App Engine Managed VMs.

## Codiad version

The image is using a heavily customized version of Codiad (https://github.com/Codiad/Codiad) which
resides in `codiad/third_party/codiad` directory.

## IDE Proxy

In order to run the IDE instances for developers in a cloud project, there is an IDE proxy running
on the managed VM which routes the requests to the individual Codiad containers for each developer
based on their email. The IDE proxy is written in nodejs. It is responsible for creating a Codiad
container for a user as soon as they connect to the IDE. Thereafter all of the request coming from
that user will be forwarded to the respective container. The authentication is done through
appengine. Proxy code can be found under `ide-proxy` directory.


## Included extras

- Kythe: used for source code indexing.
    The current included version is 0.0.8(https://github.com/google/kythe/releases/tag/v0.0.8).
    Kythe is installed by downloading its .tar.gz image from the github repository.
- Shipshape: for providing lint messages in IDE.
    Shipshape is installed by downloading its command line program from their public GCS bucket.
- Web terminal: A customized version of term.js(https://github.com/chjj/term.js) is what we use in
    IDE to expose the underlying container. IDE is installed through a git submodule which resides
    in a Google cloud repository.

## Required Google Cloud API

- Google Compute Engine
- Google Cloud Storage

## Optional Google Cloud API

- Cloud Debugger API

## Building

### Building a dev image to test your changes to IDE

In order to do so, please see the `README.md` file in `codiad` directory.

### Building a testing image

The image is built using Make, and the testing target builds a new testing image
and tags it as testing(and uploads it to gcr.io). Simply run the following command in the root
directory:

    make testing

### Labelling a validated testing image as "latest"

Once you've validated that a testing image is good, mark it as stable using the "release"
make target:

    make release
