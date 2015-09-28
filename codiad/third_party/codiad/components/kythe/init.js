/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $) {

  var codiad = global.codiad;

  $(function() {
    codiad.kythe.init();
  });

  codiad.kythe = {
    controller: 'components/kythe/controller.php',
    // A timeout variable for highlighting local xrefs.
    highlightTimeout: null,
    infoCard: undefined,

    init: function() {
      var _this = this;
      codiad.active.editor.on('cursorActivity', function(cm) {
        _this.cursorActivity(cm);
      });
      codiad.active.editor.on('swapDoc', function(cm) {
        _this.cursorActivity(cm);
      });
    },

    // Calls the `highlightLocalRefs' function after 700 milliseconds of cursor's inactivity.
    cursorActivity: function(cm) {
      var _this = this;
      clearTimeout(this.highlightTimeout);
      if (this.infoCard) {
        this.infoCard.remove();
      }
      this.infoCard = undefined;
      this.highlightTimeout = setTimeout(function() {_this.highlightLocalRefs(cm);}, 700);
    },

    jumpToDefinition: function(editor) {
      var cursor = editor.getCursor();
      if (!codiad.active.activeBuffer) {
        return;
      }
      $.get(this.controller, {action: 'jump_to_definition',
                              filepath: codiad.active.activeBuffer.path,
                              line: cursor.line, column: cursor.ch},
            function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response != 'error') {
          if (response.node.definitions) {
            var filepath = response.node.definitions[0].file.path;
            codiad.filemanager.openFile(codiad.project.getCurrent() + '/' + filepath, true,
                                        response.node.definitions[0].start);
          }
        }
      });
    },

    showInfoCard: function(editor) {
      if (!codiad.active.activeBuffer) {
        return;
      }
      var _this = this;
      var cursor = editor.getCursor();
      $.get(this.controller, {action: 'jump_to_definition',
                              filepath: codiad.active.activeBuffer.path,
                              line: cursor.line, column: cursor.ch},
            function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response != 'error') {
          if (response.node.definitions) {
            var filepath = response.node.definitions[0].file.path;
            _this.infoCard = $('<div class="kythe-info-card">Defined in: ' + filepath + '</div>')[0];
            editor.addWidget(cursor, _this.infoCard, true /* scroll into view */);
          }
        }
      });
    },

    // Calls the server to get the local xrefs and then highlight them in the file.
    highlightLocalRefs: function(cm) {
      var doc = cm.getDoc();
      if (doc.kytheMarks) {
        doc.kytheMarks.forEach(function(element) {
          element.clear();
        });
      } else {
        doc.kytheMarks = [];
      }
      if (!codiad.active.activeBuffer) {
        return;
      }
      var cursor = doc.indexFromPos(cm.getCursor());
      $.get(this.controller, {action: 'get_local_refs',
                              filepath: codiad.active.activeBuffer.path,
                              cursor: cursor
                             }, function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response != 'error') {
          response.forEach(function(element) {
            var start = doc.posFromIndex(element.start);
            var end = doc.posFromIndex(element.end);
            doc.kytheMarks.push(codiad.active.activeBuffer.doc.markText(
              start, end, {className: 'kythe-local-ref'}));
          });
        }
      });
    },
  };
})(this, jQuery);
