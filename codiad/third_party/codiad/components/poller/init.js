/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */
(function(global, $) {

  var codiad = global.codiad;

  $(function() {
    codiad.poller.init();
  });

  codiad.poller = {

    interval: 20000,

    init: function() {
      var _this = this;
      setInterval(function() {

        _this.checkAuth();
        _this.saveDrafts();

      }, _this.interval);

    },

    //////////////////////////////////////////////////////////////////
    // Poll authentication
    //////////////////////////////////////////////////////////////////

    checkAuth: function() {

      // Run controller to check session (also acts as keep-alive) & Check user
      $.get(codiad.user.controller + '?action=verify', function(data) {
        if (data == 'false') {
          codiad.user.logout();
        }
      });
    },

    //////////////////////////////////////////////////////////////////
    // Poll For Auto-Save of drafts (persist)
    //////////////////////////////////////////////////////////////////

    saveDrafts: function() {
      for(var path in codiad.active.buffers) {
        var b = codiad.active.buffers[path];
        if (b.changed) {
          var content = b.doc.getValue();

          // TODO: Add some visual indication about draft getting saved.

          // Set localstorage
          localStorage.setItem(path, content);
        }
      }
    }
  };

})(this, jQuery);