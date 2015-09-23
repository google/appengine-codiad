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

var webdriverio = require('webdriverio');
var expect = require('expect.js');
var assert = require('assert');
var fs = require('fs');
var spawnSync = require('child_process').spawnSync;

var options = {
  host: 'localhost',
  port: 4444,
  desiredCapabilities: {
    browserName: 'firefox'
  }
};

var CODIAD_PORT = 10000;
var CODIAD = 'http://localhost:' + CODIAD_PORT;
var CODIAD_WS = '/tmp/ide-ws';
var WAIT_FOR_VISIBLE_MS = 10000;

describe('Codiad Tests', function(){

  this.timeout(120000); // 2 minutes
  var client = {};
  var seleniumId;
  var codiadId;

  before(function(done) {
    var output = spawnSync('docker',
                           ['run', '--net', 'host', '-d', '-P', 'selenium/standalone-firefox']);
    seleniumId = output.stdout.toString('utf8').trim();
    output = spawnSync('docker', ['run', '-e', 'USER_EMAIL=youremail@company.com', '--privileged',
                                 '-d', '-v', CODIAD_WS + ':/usr/share/nginx/www/_', '-p',
                                 CODIAD_PORT + ':8080', 'google/codiad']);
    codiadId = output.stdout.toString('utf8').trim();
    client = webdriverio.remote(options);
    client.init(done);
  });

  // Make sure codiad loads:
  it('Codiad Loaded',function(done) {
    client.pause(10000).url(CODIAD).
    waitForVisible('div#file-manager', WAIT_FOR_VISIBLE_MS).
    getTitle(function(err, title) {
      assert(err === undefined);
      assert(title === 'Codiad');
    }).
    call(done);
  });

  // Make sure terminal appears:
  it('Codiad Terminal',function(done) {
    client.url(CODIAD).
    click('span.content-closed div.terminal-toggler').
    waitForVisible('#terminal-pane', WAIT_FOR_VISIBLE_MS).
    waitForVisible('div.terminal', WAIT_FOR_VISIBLE_MS).
    getText('div.terminal').
    then(function(text) {
      expect(text).to.contain("root's home directory is '/workspace/'.");
    }).
    call(done);
  });

  // Make sure settings dialog shows up:
  it('Codiad Settings',function(done) {
    client.url(CODIAD).
    click('div#settings-icon').
    waitForVisible('.settings-view', WAIT_FOR_VISIBLE_MS).
    getText('table.settings').
    then(function(text) {
      expect(text).to.contain("Line Numbers");
    }).
    call(done);
  });

  // Create a file:
  it('Create File',function(done) {
    client.url(CODIAD).
    rightClick('a#project-root').
    waitForVisible('div#context-menu', WAIT_FOR_VISIBLE_MS).
    click('=New File').
    waitForVisible('div#modal-content', WAIT_FOR_VISIBLE_MS).
    setValue('form.codiad-form input[name="object_name"]', 'file.md').
    click('button*=Create').
    getText('a.file').
    then(function(value) {
      expect(value).to.contain("file.md");
    }).
    call(done);
  });

  // Delete the created file:
  it('Delete File',function(done) {
    client.url(CODIAD).
    rightClick('a*=file.md').
    waitForVisible('div#context-menu', WAIT_FOR_VISIBLE_MS).
    click('=Delete').
    waitForVisible('div#modal-content', WAIT_FOR_VISIBLE_MS).
    click('button*=Delete').
    getText('div#file-manager').
    then(function(value) {
      expect(value).to.not.contain("file.md");
    }).
    call(done);
  });

  after(function(done) {
    client.end(done).then(function() {
      fs.unlink(CODIAD_WS + '/workspace/cloud-project/file.md', function(){});
      spawnSync('docker', ['stop', codiadId]);
      spawnSync('docker', ['stop', seleniumId]);
    });
  });
});
