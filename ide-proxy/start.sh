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

#!/bin/bash
export IDE_IMAGE=google/codiad
export PROJECT=$(curl http://metadata.google.internal/computeMetadata/v1/project/project-id -H "Metadata-Flavor: Google")

cd /app
cat ./codiad.tgz.part.* > ./codiad.tgz
gzip -dc ./codiad.tgz | docker load
rm -f ./codiad.tgz.part.*

# Setting up the GSC bucket for the IDE
export IDE_BUCKET=$(echo "gs://ide-data_${PROJECT}_appspot_com" | sed 's/:/_/g')
export IDE_DATA_DIR=/ide-data
gsutil mb -p ${PROJECT} ${IDE_BUCKET}

mkdir -p ${IDE_DATA_DIR}/workspaces

mkdir -p /var/log/app_engine/custom_logs/

mkdir -p /var/log/supervisor
/usr/bin/supervisord -c /etc/supervisord.conf
