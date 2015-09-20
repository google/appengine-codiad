var webdriverio = require('webdriverio'),
    assert      = require('assert');

describe('my webdriverio tests', function(){

  this.timeout(99999999);
  it('Github test',function(done) {
    browser
      .url('https://github.com/')
      .getElementSize('.header-logo-wordmark', function(err, result) {
      assert(err === undefined);
      assert(result.height === 26);
      assert(result.width  === 37);
    }).getTitle(function(err, title) {
      assert(err === undefined);
      assert(title === 'GitHub · Build software better, together.');
    }).call(done);
  });
});