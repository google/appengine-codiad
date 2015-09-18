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

FROM google/dev-common

# Installing term.js
ADD third_party/term.js /term.js
RUN cd /term.js && npm install

# git configs
ADD gitconfig /etc/gitconfig
RUN git config --global color.ui true

# Support Gerrit
ADD git-credential-gerrit.sh /usr/local/bin/git-credential-gerrit.sh
RUN chmod +x /usr/local/bin/git-credential-gerrit.sh

# Link google cloud commands in the /bin
RUN ln -s ${CLOUD_SDK}/bin/* /bin

# nginx config
RUN echo "\ndaemon off;" >> /etc/nginx/nginx.conf
RUN echo "\nenv[PATH] = /bin/:/sbin/:/usr/bin/:/usr/sbin/:/usr/local/bin/:/usr/local/sbin/:/google/google-cloud-sdk/bin" >> /etc/php5/fpm/php-fpm.conf
RUN sed -i 's/user www-data;/user root;/g' /etc/nginx/nginx.conf
RUN sed -i 's/www-data/root/g' /etc/php5/fpm/pool.d/www.conf

ADD nginx-sites-config /etc/nginx/sites-available/default

RUN sed -i 's/^post_max_size.*/post_max_size = 500M/' /etc/php5/fpm/php.ini
RUN sed -i 's/^upload_max_filesize.*/upload_max_filesize = 500M/' /etc/php5/fpm/php.ini

ADD bashrc.inc /root/.bashrc
ADD bash-profile /tmp/bash-profile
RUN cat /tmp/bash-profile >> /etc/profile

# Add image configuration and scripts
ADD start.sh /start.sh
RUN chmod 755 /*.sh

ADD supervisord.conf /etc/supervisord.conf

ADD third_party/codiad/tools/list_comments_for_current_branch.js /usr/local/bin/
ADD third_party/codiad/tools/list_open_reviews_for_current_branch.js /usr/local/bin/

ADD third_party/codiad/ /usr/share/nginx/www

ENV TZ=America/Los_Angeles
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# ------------------------------------------------------------------------------
# Expose ports.
EXPOSE 8080

VOLUME /usr/share/nginx/www/_

ENV ONRUN $ONRUN "bash /start.sh"
