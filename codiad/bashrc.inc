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

# don't put duplicate lines or lines starting with space in the history.
# See bash(1) for more options
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=40000
HISTFILESIZE=60000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

export PROMPT_COMMAND='history -a'

export HOME=/workspace/
export LS_OPTIONS='--color=auto -h'
alias ls='ls $LS_OPTIONS'
alias ll='ls $LS_OPTIONS -l'
alias la='ls $LS_OPTIONS -la'

export GREP_OPTIONS='--color=auto'

export PS1='\[$(tput setaf 5)\][\[$(tput setaf 2)\]\u@\h\[$(tput setaf 5)\]]\[$(tput bold)\]\[$(tput setaf 4)\]\w\n\[$(tput sgr0)\]\[$(tput bold)\]\[$(tput setaf 5)\]>\[$(tput sgr0)\] '

if [ -f /etc/bash_completion ] && ! shopt -oq posix; then
    . /etc/bash_completion
fi

export PATH=$PATH:/usr/local/go/bin:${CLOUD_SDK}/bin

cd $HOME

echo "root's home directory is '/workspace/'."
echo "'/workspace/' contains your projects and is backed up in GCS."
