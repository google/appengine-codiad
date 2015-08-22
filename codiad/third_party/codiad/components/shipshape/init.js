/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){
  $(function() {
    codiad.shipshape.init();
  });

  // The linter object. Currently this object provides linting for go language.
  // Later we are planning to provide linting for other languages as soon as we
  // can integrate with shipshape.
  codiad.shipshape = {

    controller: 'components/shipshape/controller.php',

    init: function() {
      var _this = this;
      // We want to trigger shipshape only when the file is saved.
      amplify.subscribe('active.saved', this, function() {
        _this.triggerLint();
      });

      // Register shipshape linter in CodeMirror
      var shipshapeRunner = function(fileContent, updateLinting, options, cm) {
        // If file is saved then run the shipshape. Otherwise skip.
        if (!codiad.active.activeBuffer.changed) {
          _this.runShipshape(codiad.active.activeBuffer.path, updateLinting, options, cm);
        }
      };

      // Indicat that this linter is async
      shipshapeRunner.async = true;
      CodeMirror.registerGlobalHelper('lint', '', function(mode, cm) {
        // These are the only supported languages in shipshape so far.
        return mode.name === 'javascript' || mode.name === 'go' || mode.name === 'python';
      } , shipshapeRunner);
    },

    triggerLint: function() {
      // Disabling and enabling the linter would trigger a lint event.
      codiad.active.editor.performLint();
    },

    runShipshape: function(filePath, updateLinting /*callback*/, options, cm) {
      console.log('Linting started.');
      var _this = this;
      // Make a post call to linter controller
      $.get(_this.controller, {action: 'run', filepath: filePath},
             function(data) {
        // User can switch the active file, if that happens we don't want to show
        // shipshape results in a wrong editor. The following if guards against that.
        if (filePath === codiad.active.activeBuffer.path) {
          var response = codiad.jsend.parse(data);
          var findings = [];
          if (response && response != 'error') {
            // Populate the array of findings
            response.analyze_response.forEach(function(analyzerResponse) {
              if (analyzerResponse.note) {
                analyzerResponse.note.forEach(function(n) {
                  // Shipshape's reported line and column are 1-based.
                  // Codemirror is 0-based.
                  var line = n.location.range.start_line - 1;
                  var col = n.location.range.start_column - 1;
                  findings.push({
                    from: CodeMirror.Pos(line, col),
                    to: CodeMirror.Pos(line, col),
                    message: '[' + n.category + '] ' + n.description,
                    severity : 'warning'
                  });
                });
              }
            });
          }
          updateLinting(cm, findings);
        }
        console.log('Linting finished.');
      });
    }
  };
})(this, jQuery);
