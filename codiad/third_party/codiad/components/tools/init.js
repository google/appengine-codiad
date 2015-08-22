
  
/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */
(function(global, $) {
  var codiad = global.codiad;

$(function() {
    codiad.tools.init();
  });

  codiad.tools = {

    init: function() {
    },

    // default options.
    // look at src/js/beautify*.js for the list of options.
    opts : {
        indent_size: 2,
        indent_char: ' ',
        preserve_newlines: true,
        jslint_happy: false,
        keep_array_indentation: false,
        brace_style: 'collapse',
        space_before_conditional: true,
        break_chained_methods: false,
        selector_separator: '\n',
        end_with_newline: false
    },

    doBeautify: function(editor, beautifier) {
      if (!editor.somethingSelected()) {
        codiad.message.error(i18n('Nothing selected'));
        return;
      }
      var input = editor.getSelection();
      var output = beautifier(input, this.opts);
      editor.replaceSelection(output, "around");
    },

    cssBeautify: function(editor) {
      if (!exports || !exports.css_beautify) {
        codiad.message.error(i18n('CSS Beautifier not loaded'));
        return;
      }
      this.doBeautify(editor, exports.css_beautify);
    },

    htmlBeautify: function(editor) {
      if (!exports || !exports.html_beautify) {
        codiad.message.error(i18n('HTML Beautifier not loaded'));
        return;
      }
      this.doBeautify(editor, exports.html_beautify);
    },

    jsBeautify: function(editor) {
      if (!exports || !exports.js_beautify) {
        codiad.message.error(i18n('JS Beautifier not loaded'));
        return;
      }
      this.doBeautify(editor, exports.js_beautify);
    },
  };

})(this, jQuery);
