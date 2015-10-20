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
FROM google/dind

# Install common development packages.
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apt-transport-https \
        bash-completion \
        build-essential \
        ca-certificates \
        clang \
        cron \
        curl \
        emacs-nox \
        gcc \
        git \
        git-core \
        golang \
        jq \
        less \
        locales \
        lsb-release \
        make \
        man-db \
        manpages \
        maven \
        mercurial \
        mysql-client \
        nano \
        nginx \
        openjdk-8-jdk \
        openjdk-8-jre-headless \
        openssh-server \
        php5-cli \
        php5-common \
        php5-dev \
        php5-fpm \
        php5-gd \
        php-pear \
        python \
        python-dev \
        python-setuptools \
        rlwrap \
        screen \
        sudo \
        supervisor \
        tmux \
        unzip \
        vim \
        wget \
        zip && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN easy_install -U pip
RUN pip install -U crcmod

# Installing node:
RUN curl https://deb.nodesource.com/node_0.12/pool/main/n/nodejs/nodejs_0.12.7-1nodesource1~jessie1_amd64.deb > node.deb \
 && dpkg -i node.deb \
 && rm node.deb

RUN npm install -g pangyp\
 && ln -s $(which pangyp) $(dirname $(which pangyp))/node-gyp\
 && npm cache clear\
 && node-gyp configure || echo ""

ENV NODE_ENV production

RUN npm install -g js-beautify uglify-js uglifycss firebase firebase-token-generator webdriverio \
      mocha expect.js

# Adding git-appraise
ENV GOPATH /usr/local/
RUN go get github.com/google/git-appraise/git-appraise

# Adding Kythe
ENV KYTHE_VERSION v0.0.15
RUN wget -P /tmp https://github.com/google/kythe/releases/download/${KYTHE_VERSION}/kythe-${KYTHE_VERSION}.tar.gz && \
    tar xvfz /tmp/kythe-${KYTHE_VERSION}.tar.gz -C /tmp/ && \
    mkdir -p /opt/kythe && cp -R /tmp/kythe-${KYTHE_VERSION}/* /opt/kythe && \
    rm -rf /tmp/*

# Install a UTF-8 locale by default.
RUN echo "en_US.UTF-8 UTF-8" >/etc/locale.gen && \
    locale-gen && \
    update-locale LANG=en_US.UTF-8

# Install the Google Cloud SDK.
RUN wget https://dl.google.com/dl/cloudsdk/release/google-cloud-sdk.zip && \
    unzip google-cloud-sdk.zip -d /google/ && \
    rm google-cloud-sdk.zip
ENV CLOUD_SDK /google/google-cloud-sdk
RUN $CLOUD_SDK/install.sh \
        --usage-reporting=true \
        --rc-path=/etc/bash.bashrc \
        --bash-completion=true \
        --path-update=true \
        --disable-installation-options
ENV PATH $CLOUD_SDK/bin:$PATH

# Disable the automatic update checks by Cloud SDK since the container
# environment is assumed to be auto-managed, and we don't want to advertise
# the manual update process too much.
RUN gcloud config set \
    --scope installation \
    component_manager/disable_update_check True

# Install the gcloud preview app support and Managed VMs.
RUN yes | \
    CLOUDSDK_COMPONENT_MANAGER_FIXED_SDK_VERSION=0.9.79 gcloud components update -q \
        alpha \
        app \
        app-engine-java \
        app-engine-python \
        beta \
        kubectl \
        preview

# Git credential helpers for source.developers.google.com and Gerrit.
ADD gitconfig /etc/gitconfig
RUN chmod -R 644 /etc/gitconfig

# Make it so the user does not need to type in their password for sudo
RUN echo "%sudo ALL=NOPASSWD: ALL" >> /etc/sudoers

# Start the cron daemon.
ENV ONRUN $ONRUN "cron"

# Add cron job to run "gcloud docker --authorize_only" every 5 minutes.
ADD gcloud_docker_auth.sh /google/scripts/gcloud_docker_auth.sh
RUN chmod -R a+rx /google/scripts/gcloud_docker_auth.sh
RUN (crontab -l 2>/dev/null; \
        echo '*/5 * * * * /google/scripts/gcloud_docker_auth.sh') \
    | crontab

# Eagerly run this authorization script upon startup.
ENV ONRUN $ONRUN "/google/scripts/gcloud_docker_auth.sh"

# Set an environment variable to configure which container server to use.
# We use the Google Container Registry:
#     https://cloud.google.com/tools/container-registry/.
ENV GCLOUD_CONTAINER_SERVER gcr.io

