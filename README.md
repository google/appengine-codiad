# Codiad Managed VMs Docker Image

![Screenshot of Codiad running on MVMs](/codiad-screenshot.png?raw=true "Screenshot of Codiad running on MVMs")


This repo defines a Docker Image that can be used to run Codiad on App Engine Managed VMs.

## Codiad

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
    Kythe is installed by downloading its .tar.gz image from the github repository.
    We try to keep up with latest release of Kythe from https://github.com/google/kythe/releases/.
- Shipshape: for providing lint messages in IDE.
    Shipshape is installed by downloading its command line program from their public GCS bucket.
- Web terminal: A customized version of term.js(https://github.com/chjj/term.js) is what we use in
    IDE to expose the underlying container. IDE is installed through a git submodule which resides
    in a Google cloud repository.
- Git appraise: Integrated with git-appraise for sending code reviews.
    See https://github.com/google/git-appraise for more information.

## Required Google Cloud API

- Google Compute Engine
- Google Cloud Storage

## Optional Google Cloud API

- Cloud Debugger API

## Building

### Building a dev image to test your changes to IDE

In order to do so, please see the `README.md` file in `codiad` directory.

### Deploying to a Google Cloud project

Please see the instructions in `ide-proxy` directory.

## How does it work?

The IDE is deployed as a Managed VM (MVM) module into a cloud project. This module is responsible
for handling requests coming from different users of the IDE and dispatching them to the right
Codiad container. The general architecture of the system is as follows:

```
                       +      +----------------------------------+
                       |      |                                  |
User A +----------->   +----------------+      IDE Proxy         |
                       |      |         |                        |
                       |      |         |                        |
User B +----------->   +--------------------------------+        |
                       |      |         |               |        |
                       |      |         |               |        |
                       +      |         |               |        |
                      MVM     |         |               |        |
                      Auth    |         |               |        |
                              |         |               |        |
                              |    +----v------+  +-----v-----+  |
                              |    | User A    |  | User B    |  |
                              |    | Codiad    |  | Codiad    |  |
                              |    | Container |  | Container |  |
                              |    +-----------+  +-----------+  |
                              +----------------------------------+
```

IDE proxy manages the codiad containers. It is respobsible for creating(and recreating) them and
routing requests to them based on user's email address which is registered with the cloud project.

### Security
As can be seen in the above diagram, the authentication for each user is done by MVM. Users are
authenticated with their cloud credential for the cloud project. The IDE is accessed by all users
using the same secure URL, e.g. https://codiad-YOUR_CLOUD_PROJECT.appspot.com.

The Codiad containers are run by project's service account and not by user's credential. No user's
credential is stored anywhere in the container by the system.

Codiad containers for all users are run in the same machine and there is no security boundary
established for them. Hence a user `A`'s container could potentially access user `B`'s container.

## Running Codiad Locally
It is possible to run Codiad locally on a machine without using the IDE proxy and MVM hosting. In
order to do so, see the `README.md` file in `codiad` directory.
