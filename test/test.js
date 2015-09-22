var webdriverio = require('webdriverio');
var expect = require('expect.js');
var assert = require('assert');
var should = require('should');

var options = {
  host: 'localhost',
  port: 4444,
  desiredCapabilities: {
    browserName: 'firefox'
  }
};

describe('Codiad Tests', function(){

  this.timeout(120000); // 2 minutes
  var client = {};

  before(function(done){
    client = webdriverio.remote(options);
    client.init(done);
  });

  it('Codiad Terminal',function(done) {
    client.url('http://localhost:10000/').
    getTitle(function(err, title) {
      assert(err === undefined);
      assert(title === 'Codiad');
    }).
    click('span.content-closed div.terminal-toggler').
    waitForVisible('#terminal-pane', 2000).waitForVisible('div.terminal', 2000).
    getText('div.terminal').
    then(function(text) {
      expect(text).to.contain("root's home directory is '/workspace/'.");
    }).
    call(done);
  });

  it('Codiad Settings',function(done) {
    client.url('http://localhost:10000/').
    click('div#settings-icon').
    waitForVisible('.settings-view', 2000).
    getText('table.settings').
    then(function(text) {
      expect(text).to.contain("Line Numbers");
    }).
    call(done);
  });

  it('Create File',function(done) {
    client.url('http://localhost:10000/').
    rightClick('a#project-root').
    waitForVisible('div#context-menu', 2000).
    click('=New File').
    waitForVisible('div#modal-content', 2000).
    setValue('form.codiad-form input[name="object_name"]', 'file.md').
    click('button*=Create').
    getText('a.file').
    then(function(value) {
      expect(value).to.contain("file.md");
    }).
    call(done);
  });

  after(function(done) {
    client.end(done);
  });
});
