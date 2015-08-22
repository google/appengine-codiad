#!/bin/bash
#
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
#
# Updates .dockercfg with credentials to ${GCLOUD_CONTAINER_SERVER}.
#

set -o errexit
set -o nounset
set -o pipefail

# Only authorize if we have credentials.
if gcloud auth print-access-token &> /dev/null; then
  gcloud docker --authorize-only --server="${GCLOUD_CONTAINER_SERVER}"
fi

