/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){
  $(function() {
    codiad.layout.init();
  });

  codiad.layout = {

    layoutObject: null,

    triggerResizeEvent: function() {
      $('#editor-region').trigger('e-resize-init');
      $('#review-content').trigger('e-resize-init');
    },

    resizeAll: function() {
      var _this = this;
      var centerAreaHeight = $('.ui-layout-center').outerHeight();
      var eastAreaHeight = $('.ui-layout-east').outerHeight();
      var southAreaHeight = $('.ui-layout-south').outerHeight();
      var topBottomHeight = $('#editor-bottom-bar').outerHeight() +
          $('#editor-top-bar').outerHeight();
      var reviewTopBarHeight = $('#review-top-bar').outerHeight();
      var debuggerTopBarHeight = $('#debugger-top-bar').outerHeight();
      $('#editor-region').css({'height': (centerAreaHeight - topBottomHeight) + 'px'});
      $('#review-content').css({'height': (eastAreaHeight - reviewTopBarHeight) + 'px'});
      $('#terminal-pane').css({'height': (southAreaHeight) + 'px'});
      $('#kythe-pane').css({'height': (southAreaHeight) + 'px'});
      $('#debugger-content').css({'height': (eastAreaHeight - debuggerTopBarHeight) + 'px'});
      $('#root-editor-wrapper').css({'height': (centerAreaHeight - topBottomHeight) + 'px'});
      _this.triggerResizeEvent();
    },

    init: function() {
      var _this = this;
      $(document).ready(function() {
        // CREATE THE LAYOUT
        _this.layoutObject = $('body').layout({
          defaults: {
            togglerLength_open: -1,
            togglerLength_closed: -1,
            spacing_open: 8,
            spacing_closed: 8,
            resizeWhileDragging: false,
            enableCursorHotkey: false,
          },
          south: {
            initClosed: true,
            onopen_end: function() {
              amplify.publish('layout.south-panel.opened');
            },
            size: '26%',
            onresize_end: function() {
              amplify.publish('layout.south-panel.resized');
            },
            spacing_closed:			21,			// wider space when closed
            spacing_open:			21,			// wider space when closed
            togglerLength_closed:	180,			// make toggler 'square' - 21x21
            togglerLength_open:	180,			// make toggler 'square' - 21x21
            togglerAlign_closed:	"top",		// align to top of resizer
            togglerAlign_open:	"top",		// align to top of resizer
            togglerTip_closed:		"Open",
            resizerTip_open:		"Resize",
            slideTrigger_open:		"click", 	// default
            togglerContent_closed: _this.getTemplate('#south-panel-closed-hb-template'),
            togglerContent_open: _this.getTemplate('#south-panel-open-hb-template'),
          },
          east: {
            initClosed: true,
            size: '38%',
            spacing_closed:			21,			// wider space when closed
            spacing_open:			21,			// wider space when closed
            togglerLength_closed:	200,			// make toggler 'square' - 21x21
            togglerLength_open:	200,			// make toggler 'square' - 21x21
            togglerAlign_closed:	"top",		// align to top of resizer
            togglerAlign_open:	"top",		// align to top of resizer
            togglerTip_closed:		"Open",
            resizerTip_open:		"Resize",
            slideTrigger_open:		"click", 	// default
            togglerContent_closed: _this.getTemplate('#east-panel-closed-hb-template'),
            togglerContent_open: _this.getTemplate('#east-panel-open-hb-template'),
          },
          west: {
            size: '17%',
            spacing_closed:			21,			// wider space when closed
            spacing_open:			21,			// wider space when closed
            togglerLength_closed:	130,			// make toggler 'square' - 21x21
            togglerLength_open:	130,			// make toggler 'square' - 21x21
            togglerAlign_closed:	"top",		// align to top of resizer
            togglerAlign_open:	"top",		// align to top of resizer
            togglerTip_closed:		"Open",
            resizerTip_open:		"Resize",
            slideTrigger_open:		"click", 	// default
            togglerContent_closed: _this.getTemplate('#west-panel-closed-hb-template'),
            togglerContent_open: _this.getTemplate('#west-panel-open-hb-template'),
          },
          center: {
            onresize_end: function() {
              _this.resizeAll();
            },
          },
          north: {
            size: '22',
            resizable: false,
            slidable: false,
            closable: false,
            spacing_open: 0,
            spacing_close: 0,
          },
        });
        _this.layoutObject.allowOverflow('north');
        _this.layoutObject.allowOverflow('south');
        _this.layoutObject.allowOverflow('center');

        var $eastToggler = _this.layoutObject.togglers.east;
        $eastToggler.unbind('click');
        $eastToggler.find('.review-toggler').click(function(e) {
          if (_this.layoutObject.state.east.isClosed) {
            _this.layoutObject.toggle('east');
          }
          $('#debugger-pane').hide();
          $('#review-pane').show();
          e.stopPropagation();
        });
        $eastToggler.find('.debugger-toggler').click(function(e) {
          if (_this.layoutObject.state.east.isClosed) {
            _this.layoutObject.toggle('east');
          }
          $('#review-pane').hide();
          $('#debugger-pane').show();
          e.stopPropagation();
        });
        $eastToggler.find('.east-pane-toggler').click(function(e) {
          _this.layoutObject.toggle('east');
          e.stopPropagation();
        });

        var $southToggler = _this.layoutObject.togglers.south;
        $southToggler.unbind('click');
        $southToggler.find('.terminal-toggler').click(function(e) {
          if (_this.layoutObject.state.south.isClosed) {
            _this.layoutObject.toggle('south');
          }
          $('#kythe-pane').hide();
          $('#terminal-pane').show();
          amplify.publish('layout.south-panel.resized');
          e.stopPropagation();
        });
        $southToggler.find('.kythe-toggler').click(function(e) {
          if (_this.layoutObject.state.south.isClosed) {
            _this.layoutObject.toggle('south');
          }
          $('#terminal-pane').hide();
          $('#kythe-pane').show();
          e.stopPropagation();
        });
        $southToggler.find('.south-pane-toggler').click(function(e) {
          _this.layoutObject.toggle('south');
          e.stopPropagation();
        });
        setTimeout(function() {_this.resizeAll();}, 1000);
      });
    },

    // Fetches the template associated with `templateId' and removes newlines from it.
    // Removing newlines is important because they could cause the layout to break.
    getTemplate: function(templateId) {
      return Handlebars.compile($(templateId).html())();
    },

    toggleSouth: function() {
      this.layoutObject.toggle('south');
    },

    toggleWest: function() {
      this.layoutObject.toggle('west');
    },

    toggleEast: function() {
      this.layoutObject.toggle('east');
    }
  };
})(this, jQuery);
