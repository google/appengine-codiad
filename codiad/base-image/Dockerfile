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

FROM gcr.io/developer_tools_bundle/dev-common

# ------------------------------------------------------------------------------
# Install base
ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && \
    apt-get install -y -qq --no-install-recommends build-essential git nano supervisor \
    nginx php5-dev php5-common php5-cli php5-fpm php5-gd php-pear openjdk-8-jdk vim \
    bash-completion wget unzip python tmux screen gcc python-dev python-setuptools maven clang \
    golang && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN easy_install -U pip
# Required for GCS sync
RUN pip install -U crcmod

RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash -
RUN apt-get update && apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN curl -L https://npmjs.com/install.sh | sh

# Adding tools
ENV GOPATH /usr/local/
RUN go get github.com/google/git-appraise/git-appraise

RUN npm install -g js-beautify uglify-js uglifycss firebase firebase-token-generator

ENV KYTHE_VERSION v0.0.8
RUN wget -P /tmp https://github.com/google/kythe/releases/download/${KYTHE_VERSION}/kythe-${KYTHE_VERSION}.tar.gz && \
    tar xvfz /tmp/kythe-${KYTHE_VERSION}.tar.gz -C /tmp/ && \
    mkdir -p /opt/kythe && cp -R /tmp/kythe-${KYTHE_VERSION}/* /opt/kythe && \
    rm -rf /tmp/*

# ------------------------------------------------------------------------------
# Clean up APT when done.
RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
