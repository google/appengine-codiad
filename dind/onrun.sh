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
# Runs commands defined in the variable ONRUN, which is intepreted as
# an array of strings. We expect ONRUN to be declared in this fashion:
#
#     declare -x ONRUN="\"echo first\" \"echo second\""
#
# In a Dockerfile, a list of ENV declarations will
# construct such an ONRUN variable; for example:
#
#    ENV ONRUN "echo first"
#    ENV ONRUN $ONRUN "echo second"
#
# This produces the equivalent declaration.
#
# Each quote-delimited command will be executed in order.
#
# Last, any arguments to this script are executed in bash.
#

set -o errexit
set -o nounset
set -o pipefail

/usr/sbin/rsyslogd

# Convert the the ONRUN variable into an array.
eval COMMANDS=(${ONRUN:-})
NUM_COMMANDS=${#COMMANDS[@]}

# Put each command into this temporary file and execute it.
TEMP=$(mktemp).sh
trap "rm -rf ${TEMP}" EXIT
for (( I=0; I<${NUM_COMMANDS}; I++ )); do
  COMMAND="${COMMANDS[$I]}"
  logger -p local0.info "Executing ONRUN command ${COMMAND}"
  echo "${COMMAND}" > $TEMP
  chmod +x $TEMP
  if ! $TEMP; then
    logger -p local0.info \
      "ONRUN command $((I+1)) of ${NUM_COMMANDS} failed: ${COMMAND}"
    exit 1
  else
    logger -p local0.info \
      "ONRUN command $((I+1)) of ${NUM_COMMANDS} succeeded: ${COMMAND}"
  fi
done

# Even though we have an EXIT trap set, clean up eagerly.
rm -rf ${TEMP}

# Now run whatever arguments we were given.  Spawn a child process rather
# than 'exec' to make sure bash stays PID 1 to reap zombie children.
# TODO(aalexand): This may be insufficient to correctly handle docker stopping
# a container as bash won't propagate SIGTERM down.  Should we run a better
# init-like something?  See
# https://blog.phusion.nl/2015/01/20/docker-and-the-pid-1-zombie-reaping-problem/
/bin/bash -c "$*"
