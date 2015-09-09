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

build: create_codiad_image
	$(MAKE) -C ./base-image/ pull
	docker build -t google/ide-appengine .
	rm -f ./codiad.tgz.part.*

create_codiad_image:
	$(MAKE) -C ../codiad/
# Save codiad docker image and zip it and split it into 30MBytes chunks:
	docker save google/codiad | gzip -c | split -b 30m - codiad.tgz.part.

deploy_requirements:
	if [ -z "${PROJECT}" ]; then echo "Usage: make <target> PROJECT=<YOUR_GCP_PROJECT>"; exit 1; fi

deploy: deploy_requirements build
	cd ./deploy-config && bash ./install.sh "${PROJECT}"

deploy_testing: deploy_requirements
	cd ./deploy-config && bash ./install.sh "${PROJECT}" testing

deploy_latest: deploy_requirements
	cd ./deploy-config && bash ./install.sh "${PROJECT}" latest

# Pushes the the local build to testing
testing: deploy_requirements build
	docker tag -f google/ide-appengine gcr.io/${PROJECT}/ide-proxy:testing
	gcloud docker push gcr.io/${PROJECT}/ide-proxy:testing

# Pushes the the testing to latest(stable)
release: deploy_requirements
	gcloud docker pull gcr.io/${PROJECT}/ide-proxy:testing
	docker tag -f gcr.io/${PROJECT}/ide-proxy:testing gcr.io/${PROJECT}/ide-proxy
	gcloud docker push gcr.io/${PROJECT}/ide-proxy
