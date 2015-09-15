/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){

  var codiad = global.codiad;

  /*
   * Returns true when both p and q are true or both are false.
   */
  $.iff = function(p, q) {
    return (p && q) || (!p && !q);
  };

  //////////////////////////////////////////////////////////////////////
  // CTRL Key Bind
  //////////////////////////////////////////////////////////////////////

  $.keyCombination = function(key, ctrlPressed, altPressed, shiftPressed,
                      stopPropagation, callback, args) {
    $(document).keydown(function(e) {
      if (!args) args = [];
      if (e.keyCode == key && $.iff(ctrlPressed, (e.ctrlKey || e.metaKey)) &&
          $.iff(altPressed, e.altKey) && $.iff(shiftPressed, e.shiftKey)) {
        if (stopPropagation) {
          e.stopPropagation();
        }
        callback.apply(this, args);
        return false;
      }
    });
  };

  $(function() {
    codiad.keybindings.init();
  });

  //////////////////////////////////////////////////////////////////////
  // Bindings
  //////////////////////////////////////////////////////////////////////

  codiad.keybindings = {

    init: function() {
      // Close Modals //////////////////////////////////////////////
      $.keyCombination(27, false, false, false, false, function() {
        codiad.modal.unload();
      });
      // Search in files [Ctrl + Alt + F]
      $.keyCombination(70, true, true, false, true, function() {
        codiad.filemanager.search(codiad.project.getCurrent());
      });
      // Close a tab [Ctrl + Alt + W]
      $.keyCombination(87, true, true, false, true, function() {
        codiad.active.closeActiveTab();
      });
      // Save [CTRL + S] /////////////////////////////////////////////
      $.keyCombination(83, true, false, false, true, function() {
        codiad.active.save();
      });
      // Active Previous [CTRL + '<'] ////////////////////////////
      $.keyCombination(188, true, false, false, true, function() {
        codiad.active.move('up');
      });
      // Active Next [CTRL + '>'] //////////////////////////////
      $.keyCombination(190, true, false, false, true, function() {
        codiad.active.move('down');
      });
      // Find files [CTRL + Alt + O] ///////////////////////////////////////
      $.keyCombination(79, true, true, false, true, function() {
        codiad.filemanager.autoCompleteFiles();
      });
    }
  };

})(this, jQuery);
