# Copyright 2015 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/bin/bash

# Variables defining the deployment target
PROJECT=$1
RELEASE=$2

VERSION=1
DEFAULT_RELEASE=latest

# Local tag for the Docker image we deploy
DOCKER_TAG="google/ide-appengine"
function defaultModuleExists() {
  local project=$1
  local count=$(gcloud preview app modules list default --project $project 2>&1 \
    | grep -o "^default" | wc -l)
  if [[ $count -gt 0 ]]; then
    return 0
  else
    return 1
  fi
}

function deployDefaultModule() {
  local target_project=$1
  local tmp_dir=$(mktemp -d --tmpdir=$(pwd))
  echo
  echo "Default module doesn't exist, deploying default module now..."
  cat > ${tmp_dir}/app.yaml <<EOF
module: default
runtime: python27
api_version: 1
threadsafe: true
handlers:
- url: /
  mime_type: text/html
  static_files: hello.html
  upload: (.*html)
EOF

  cat > ${tmp_dir}/hello.html <<EOF
<html>
  <head>
    <title>Sample Hello-World Page.</title>
  </head>
  <body>
    Hello, World!
  </body>
</html>
EOF
  local status=1
  gcloud preview app deploy --force --quiet --project $target_project \
    $tmp_dir/app.yaml --version v1
  [[ $? ]] && status=0 || echo "Failed to deploy default module to $target_project"
  rm -rf $tmp_dir
  return $status
}

if [ -z $RELEASE ]; then
  # Ensure that we have a local image to deploy
  if [ -z "$(docker images -q --all ${DOCKER_TAG})" ]; then
    docker pull gcr.io/developer_tools_bundle/ide-proxy:$DEFAULT_RELEASE
    docker tag -f gcr.io/developer_tools_bundle/ide-proxy:$DEFAULT_RELEASE ${DOCKER_TAG}
  fi
else
  docker pull gcr.io/developer_tools_bundle/ide-proxy:$RELEASE
  docker tag -f gcr.io/developer_tools_bundle/ide-proxy:$RELEASE ${DOCKER_TAG}
fi

if ! defaultModuleExists $PROJECT; then
  if ! deployDefaultModule $PROJECT; then
    exit
  fi
fi

# Ensure that a private networks exists for IDE
if [ -z "$(gcloud --project=${PROJECT} compute networks list | grep codiad)" ]; then
  gcloud --project="${PROJECT}" compute networks create codiad
fi

gcloud --project="${PROJECT}" preview app deploy --set-default --force --version=${VERSION} ./app.yaml "--docker-build=local"
