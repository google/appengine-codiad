# Copyright 2015 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

user := $(shell git config user.email | sed -e "s/@/-at-/" -e "s/\\./-dot-/g")

all: build

build: create_codiad_image
	docker build -t google/ide-appengine .
	rm -f ./codiad.tgz.part.*

create_codiad_image:
	$(MAKE) -C ../codiad/
# Save codiad docker image and zip it and split it into 30MBytes chunks:
	docker save codiad | gzip -c | split -b 30m - codiad.tgz.part.

deploy_requirements:
	if [ -z "${PROJECT}" ]; then echo "Usage: make deploy PROJECT=<YOUR_GCP_PROJECT>"; exit 1; fi

deploy: deploy_requirements build
	cd ./deploy-config && bash ./install.sh "${PROJECT}"

testing: build
	docker tag -f google/ide-appengine gcr.io/developer_tools_bundle/ide-proxy:testing
	gcloud docker push gcr.io/developer_tools_bundle/ide-proxy:testing

dev: build
	docker tag -f google/ide-appengine gcr.io/developer_tools_bundle/ide-proxy:$(user)-dev
	gcloud docker push gcr.io/developer_tools_bundle/ide-proxy:$(user)-dev

release: build
	gcloud docker pull gcr.io/developer_tools_bundle/ide-proxy:testing
	docker tag -f gcr.io/developer_tools_bundle/ide-proxy:testing gcr.io/developer_tools_bundle/ide-proxy
	gcloud docker push gcr.io/developer_tools_bundle/ide-proxy
