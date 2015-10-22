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
# Changing the root's home dir to `/usr/share/nginx/www/_/workspace'.
export HOME=/usr/share/nginx/www/_/workspace
sed -i 's;:/root:;:/usr/share/nginx/www/_/workspace:;' /etc/passwd

# Setting up the IDE's work directories
mkdir -p /usr/share/nginx/www/_/workspace
mkdir -p /usr/share/nginx/www/_/data
ln -s /usr/share/nginx/www/_/workspace /
ln -s /usr/share/nginx/www/_/workspace /usr/share/nginx/www/
ln -s /usr/share/nginx/www/_/data /usr/share/nginx/www/

cp -r -n /root/. /usr/share/nginx/www/_/workspace/

chown root:www-data /usr/share/nginx/www -R

chmod a+rwX /usr/share/nginx/www/_

# Config git
git config --global user.email ${USER_EMAIL}
git config --global user.name ${USER_EMAIL}
git config --global alias.appraise '!/usr/local/bin/git-appraise'

wget http://storage.googleapis.com/shipshape-cli/shipshape -P /usr/local/bin/

chmod +x /usr/local/bin/*

shipshape --hot_start --tag prod-release-2015-10-21 $HOME &

mkdir -p /var/log/supervisor
/usr/bin/supervisord -c /etc/supervisord.conf
