/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $) {

  var codiad = global.codiad;

  $(function() {
    codiad.terminal.init();
  });

  codiad.terminal = {
    terminalResizeTimeoutId: null,

    init: function() {
      var _this = this;
      amplify.subscribe('layout.south-panel.opened', this, this.showTerminal);
      // Show a red border when terminal is in focus or otherwise remove it.
      setInterval(function() {
        _this.resizeTerminal();
        if ($('div.terminal span.terminal-cursor').length === 1) {
          $('div.terminal').addClass('terminal-infocus');
        } else {
          $('div.terminal').removeClass('terminal-infocus');
        }
      }, 700);
    },

    resizeTerminal: function() {
      var _this = this;
      var term = $('#terminal-pane').data('object');
      var socket = $('#terminal-pane').data('socket');
      if (term && socket) {
        var newSize = _this.calculateColsRows(term);
        // Do not resize when the terminal is too small. Resizing the terminal to a small size will
        // cause the browser to crash.
        if ((isNaN(newSize.cols) || isNaN(newSize.rows) ||
            !isFinite(newSize.cols) || !isFinite(newSize.rows) ||
            (newSize.cols === term.cols && newSize.rows === term.rows)) ||
            (newSize.cols < 1 || newSize.rows < 1)) {
          return;
        }
        socket.emit('resize', newSize);
        term.resize(newSize.cols, newSize.rows);
      }
    },

    widthHeight: function(font) {
      var f = font || '11px monospace',
          o = $('<div>A</div>').css({'position': 'absolute', 'float': 'left',
                                     'white-space': 'nowrap', 'visibility': 'hidden', 'font': f}
                                   ).appendTo($('body')),
          r = o[0].getBoundingClientRect(),
          wh = {'width': r.width, 'height': r.height};
      o.remove();
      return wh;
    },

    calculateColsRows: function(term) {
      var widthHeight = this.widthHeight();
      return {
        cols: Math.floor(($($('#terminal-pane')[0]).width() - 1) / widthHeight.width),
        rows: Math.floor(($($('#terminal-pane')[0]).height() - 1) / widthHeight.height)
      };
    },

    showTerminal: function() {
      var _this = this;
      if ($('#terminal-pane').data('object')) {
        $($('.terminal')).focus();
        return;
      }
      var pathComponents = document.location.pathname.split('/'),
          // Strip last part (either index.html or "", presumably)
          baseURL = pathComponents.slice(0, pathComponents.length - 1).join('/') + '/',
          resource = baseURL + "shell/socket.io";
      var socket = io.connect(document.location.origin, {
        'path': resource,
        'transports': ['flashsocket', 'htmlfile', 'xhr-polling',
                       'jsonp-polling', 'polling']
      });

      $('#terminal-pane').data('socket', socket);

      socket.on('connect', function() {
        var term = new Terminal({
          cols: 80,
          rows: 10,
          useStyle: false,
          screenKeys: false,
          cursorBlink: false,
          scrollback: 10000
        });

        $('#terminal-pane').data('object', term);

        term.on('data', function(data) {
          socket.emit('data', data);
        });

        term.on('title', function(title) {
          document.title = title;
        });

        term.open($('#terminal-pane')[0]);
        term.write('\n');

        socket.on('data', function(data) {
          term.write(data);
        });

        socket.on('ping', function(data){
          socket.emit('pong', {beat: 1});
        });

        socket.on('disconnect', function() {
          console.log('Received disconnect signal.');
          term.destroy();
          $('#terminal-pane').data('object', null);
        });
      });
    },
  };
})(this, jQuery);
