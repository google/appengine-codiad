// Copyright 2015 Google Inc. All Rights Reserved.

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var appengine = require('appengine');
var http = require('http');
var httpProxy = require('http-proxy');
var url = require('url');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var mkdirp = require('mkdirp');
var util = require('util');
var fs = require('fs');
var agent = new http.Agent({ maxSockets: Number.MAX_VALUE });

var indexFile = fs.readFileSync('index.html', {'encoding': 'utf8'});

// Scheduling a task for syncing the workspaces with the bucket in gsutil.
var SYNC_FREQUENCY_IN_MS = 120000 /* in milliseconds */ ;

// A map to store users and their IDE container info.
var db = {};

// Sends an HTML response.
function resHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write(html);
  res.end();
}

// Sends an plain text response.
function resPlain(res, plain) {
  res.writeHead(200, {
    'Content-Type': 'text/plain'
  });
  res.write(plain);
  res.end();
}

//
// Create a proxy server with custom application logic
//
var proxyServer = httpProxy.createProxyServer({
  agent: agent
});
proxyServer.on('error', function(error, req, res) {
  var json;
  console.log('proxy error: ' + error);
  if (!res.headersSent) {
    res.writeHead(500, {
      'content-type': 'application/json'
    });
  }

  json = {
    error: 'proxy_error',
    reason: error.message,
    solution: 'Try again.'
  };
  res.end(JSON.stringify(json));
});

//
// Listen to the `upgrade` event and proxy the WebSocket requests as well.
//
proxyServer.on('upgrade', function(req, socket, head) {
  proxy.ws(req, socket, head);
});

// This variable indicates whether workspace sync must be stopped or not. When the VM is shutting
// down and after we receive the /_ah/stop signal, we set this variable to true so that no more sync
// is being initiated.
var stopSync = false;

// Syncs the workspace for the user identified with 'email'.
function syncWorkspace(email) {
  if (stopSync) {
    return;
  }
  // Logic to prevent multiple concurrent sync if one of them takes too long.
  if (db[email].isSyncInProgress) {
    return;
  }
  db[email].isSyncInProgress = true;
  var syncProcess;
  var user_workspace = [process.env.IDE_DATA_DIR, 'workspaces', email].join('/');
  if (db[email].inInitialSync) {
    mkdirp.sync(user_workspace);
    console.log('Running the initial workspace sync for: ' + email);
    // Runs an asyncronous process.
    // Copy from GCS bucket to IDE:
    syncProcess = spawn('gsutil', ['-m', 'rsync', '-c', '-r',
                                   process.env.IDE_BUCKET + '/workspaces/' + email,
                                   user_workspace]);
  } else {
    console.log('Running the workspace sync to GCS bucket for: ' + email);
    // Runs an asyncronous process.
    // Copy from IDE to GCS bucket:
    syncProcess = spawn('gsutil', ['-m', 'rsync', '-c', '-r', '-d', '-e',
                                   user_workspace,
                                   process.env.IDE_BUCKET + '/workspaces/' + email]);
  }
  syncProcess.stdout.pipe(process.stdout);
  syncProcess.stderr.pipe(process.stderr);
  syncProcess.on('exit', function(code) {
    db[email].isSyncInProgress = false;
    if (db[email].inInitialSync) {
      if (code === 0) {
        db[email].inInitialSync = false;
        console.log(util.format('Initial workspace sync is finished for %s with code %s.', email, code));
      } else {
        console.log(util.format('Error during the initial workspace sync for %s with code %s.', email, code));
      }
    } else {
      console.log(util.format('Workspace sync is finished for %s with code %s.', email, code));
    }
  });
  // If an error occures during the initial sycn we need to redo it.
  syncProcess.on('error', function(err) {
    db[email].isSyncInProgress = false;
    if (db[email].inInitialSync) {
      console.log(util.format('Error during the initial workspace sync for %s: %s.', email, JSON.stringify(err)));
    }
  });
}

function syncWorkspacesWithGCS() {
  if (stopSync) {
    return;
  }
  for (var email in db) {
    if (!(db[email].isSyncInProgress)) {
      syncWorkspace(email);
    }
  }
}

// This function tries to see if user associated with `email' has a workspace in GCS.
// If yes then the `yesCallback' will be called and otherwise `noCallback'.
function hasGCSWorkspace(email, yesCallback, noCallback) {
  var lsProcess = spawn('gsutil', ['ls', process.env.IDE_BUCKET + '/workspaces/' + email]);
  lsProcess.stdout.pipe(process.stdout);
  lsProcess.stderr.pipe(process.stderr);
  lsProcess.on('exit', function(code) {
    if (code === 0) {
      yesCallback();
    } else {
      noCallback();
    }
  });
}

// Run the workspace sync task.
setInterval(syncWorkspacesWithGCS, SYNC_FREQUENCY_IN_MS);

function recreateIDE(email) {
  if (db[email] && db[email].status === 'created') {
    var cid = db[email].container_id;
    exec(util.format('docker stop %s && docker rm %s', cid, cid),
         function(error, stdout, stderr) {
      console.log(util.format('Stopped container: %s. Output: %s. Error: %s.',
                              cid, stdout, stderr));
    });
  }
  tryCreateIDE(email);
}

function tryCreateIDE(email) {
  db[email].status = 'creating';
  console.log('Creating an instance of IDE for ' + email);
  // Create
  createIDE(email, function(response) {
    if (response.error === null) {
      db[email].status = 'created';
      console.log('Created IDE for %s. Container ID is: %s. Port is: %s',
                  email, db[email].container_id, db[email].container_port);
    } else {
      console.log('Creating an instance of IDE for %s faild. ' +
                  'Next attempt in 10 seconds.', email);
      setTimeout(function() {tryCreateIDE(email);}, 10000);
    }
  });
}

// Creates an IDE container for the user.
function createIDE(user, callback) {
  if (user) {
    var user_workspace = [process.env.IDE_DATA_DIR, 'workspaces', user].join('/');
    mkdirp.sync(user_workspace);
    var docker_command =
        'docker run --privileged -d -p 8080' + ' -v ' + user_workspace +
        ':/usr/share/nginx/www/_' + ' -e USER_EMAIL="' + user + '" ' + process.env.IDE_IMAGE;
    exec(docker_command, function(error, stdout, stderr) {
      if (error) {
        // Report errors for `docker run ...` command
        callback({
          'error': error,
          'stdout': stdout,
          'stderr': stderr
        });
      } else {
        var container_id = stdout.toString().trim();
        var docker_port_command = 'docker port ' + container_id + ' 8080';
        exec(docker_port_command, function(error, stdout, stderr) {
          if (error) {
            // Report errors for `docker port ...` command
            callback({
              'error': error,
              'stdout': stdout,
              'stderr': stderr
            });
          } else {
            // Extract the port portion of the `docker port ...` result
            var port_regex = /(.*):(.*)$/gm;
            var container_port = port_regex.exec(stdout.toString().trim())[2];
            db[user].container_id = container_id;
            db[user].container_port = container_port;
            db[user].status = 'created';
            callback({'error': null});
          }
        });
      }
    });
  } else {
    callback({
      'error': 'Required params are missing!'
    });
  }
}

var server = http.createServer(function(req, res) {
  appengine.middleware.base(req, res, function() {});
  var urlMap = url.parse(req.url, true);
  var email;
  if (urlMap.pathname === '/_ah/health') {
    resPlain(res, 'ok');
  } else if (urlMap.pathname === '/_ah/start') {
    stopSync = false;
  } else if (urlMap.pathname === '/_ah/stop') {
    stopSync = true;
  } else if (urlMap.pathname === '/-/status') {
    email = req.appengine.user.email;
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    if (!db[email]) {
      db[email] = {};
    }
    res.end(JSON.stringify(db[email]));
  } else if (urlMap.pathname === '/-/recreate') {
    email = req.appengine.user.email;
    recreateIDE(email);
    res.writeHead(302, {'Location': '/'});
    res.end();
  } else {
    email = req.appengine.user.email;
    if (!db[email]) {
      db[email] = {};
      db[email].inInitialSync = true;
      hasGCSWorkspace(email, /* yes */ function() {}, /* no */ function() {
        // No need for initial sync
        db[email].inInitialSync = false;
      });
      syncWorkspace(email);
      tryCreateIDE(email);
      resHtml(res, indexFile);
    } else if (db[email].status === 'creating') {
      resHtml(res, indexFile);
    } else if (db[email].status === 'created') {
      if (db[email].inInitialSync) {
        resHtml(res, indexFile);
      } else {
        proxyServer.web(req, res, {
          target: 'http://localhost:' + db[email].container_port,
          headers: {
            'Connection': 'keep-alive'
          }
        });
      }
    }
  }
});

var port = 8080;
console.log('IDE Dashboard server listening on port: ' + port);
server.listen(port);
