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
FROM debian:jessie

# Use GCE mirror.
COPY gce-sources.list /tmp/
RUN cat /tmp/gce-sources.list /etc/apt/sources.list | \
        cat >/etc/apt/sources.list.new && \
    mv /etc/apt/sources.list.new /etc/apt/sources.list && \
    rm -f /tmp/gce-sources.list

# Install our custom Jessie backports apt repository.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl rsyslog && \
    apt-get clean
RUN curl https://storage.googleapis.com/dev-con-jessie-apt/convoy.key \
        | apt-key add -
RUN echo deb http://storage.googleapis.com/dev-con-jessie-apt/ jessie main \
        >> /etc/apt/sources.list

# Install basic tools required for dind, along with other useful tools.
ENV DEBIAN_FRONTEND noninteractive
# Based on jpetazzo/dind, rebased on debian:jessie
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        apparmor \
        apt-transport-https \
        initramfs-tools \
        iptables \
        lxc \
        python3 \
        wget && \
    apt-get clean

# Install Docker.
RUN echo deb https://get.docker.io/ubuntu docker main \
        > /etc/apt/sources.list.d/docker.list
RUN apt-key adv \
        --keyserver hkp://keyserver.ubuntu.com:80 \
        --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        lxc-docker-1.6.2 && \
    apt-get clean
# Some Google Cloud SDK components (Maven gcloud:deploy plugin in particular)
# rely on DOCKER_HOST to be explicitly set, so set that.
RUN echo "export DOCKER_HOST=unix:///var/run/docker.sock" \
    >/etc/profile.d/set-default-docker-host.sh

# Add jpetazzo's magic wrapper.
# This has been modified to start docker using 'service',
# which means setting DOCKER_DAEMON_ARGS does nothing.
# Instead, you can set DOCKER_SETTINGS_FILE to change
# /etc/default/docker prior to starting the docker service.
ADD third_party/jpetazzo/dind/wrapdocker /google/scripts/wrapdocker.sh
RUN chmod +x /google/scripts/wrapdocker.sh

# Must be excluded from aufs.
VOLUME /var/lib/docker

# Make the docker daemon log to a file, so we can realistically use the shell.
ENV LOG file

ENV DOCKER_HOST unix:///var/run/docker.sock

# Add our onrun utility, which allows commands to be run on startup
# by adding them to the ONRUN environment variable. For example:
#     ENV ONRUN $ONRUN "echo running my command"
ADD onrun.sh /google/scripts/onrun.sh
RUN chmod +x /google/scripts/onrun.sh

# Now run the wrapdocker script on startup.
ENV ONRUN "/google/scripts/wrapdocker.sh"

# WARNING: Do not override this entrypoint; doing so will cause your
# image to not run wrapdocker and it will not behave correctly.
# Instead, add your command to the ONRUN environment variable:
# Bad:
#     ENTRYPOINT [<...>]
# Good:
#     ENV ONRUN $ONRUN "<...>"
ENTRYPOINT ["/bin/bash", "/google/scripts/onrun.sh"]
