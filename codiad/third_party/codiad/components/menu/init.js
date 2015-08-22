/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){
  $(function() {
    codiad.menu.init();
  });

  codiad.menu = {

    controller: 'components/menu/controller.php',

    menus: [
      {name: 'workspace', label: 'Workspace',
       items: [
         {label: 'Projects...', key: '', command: 'cmd_openProjects'},
         {label: 'Create project', key: '', command: 'cmd_createProject'},
       ]
      },
      {name: 'file', label: 'File',
       items: [
         {label: 'Save file', key: 'Ctrl-S', command: 'cmd_saveFile'},
         {type: 'separator'},
         {label: 'Close file', key: 'Ctrl-Alt-W', command: 'cmd_closeFile'},
         {label: 'Next file', key: 'Ctrl-.', command: 'cmd_nextFile'},
         {label: 'Prev file', key: 'Ctrl-,', command: 'cmd_prevFile'},
         {type: 'separator'},
         {label: 'Search for file', key: 'Ctrl-Alt-O', command: 'cmd_searchFile'},
         {label: 'Search for text', key: 'Ctrl-Alt-F', command: 'cmd_searchText'},
         {type: 'separator'},
         {label: 'Settings', key: '', command: 'cmd_settings'},
       ]
      },
      {name: 'edit', label: 'Edit',
       items: [
         {label: 'Copy', key: 'Ctrl-C', command: 'cmd_copy'},
         {label: 'Paste', key: 'Ctrl-V', command: 'cmd_paste'},
         {label: 'Cut', key: 'Ctrl-X', command: 'cmd_cut'},
         {type: 'separator'},
         {label: 'Complete word', key: 'Ctrl-Space', command: 'cmd_autocomplete'},
         {label: 'Toggle line comment', key: 'Ctrl-/', command: 'cmd_toggleComment'},
         {type: 'separator'},
         {label: 'Select all', key: 'Ctrl-A', command: 'cmd_selectAll'},
         {type: 'separator'},
         {label: 'Undo', key: 'Ctrl-Z', command: 'cmd_undo'},
         {label: 'Redo', key: 'Shift-Ctrl-Z', command: 'cmd_redo'},
         {type: 'separator'},
         {label: 'Delete word', key: 'Ctrl-Del', command: 'cmd_delGroupAfter'},
         {label: 'Delete prev word', key: 'Ctrl-Bksp', command: 'cmd_delGroupBefore'},
         {label: 'Delete line', key: 'Ctrl-D', command: 'cmd_deleteLine'},
         {type: 'separator'},
         {type: 'sub', label: 'Indent',
          items: [
            {label: 'Indent', key: 'Shift-Tab', command: 'cmd_indentAuto'},
            {label: 'Indent less', key: 'Ctrl-[', command: 'cmd_indentLess'},
            {label: 'Indent more', key: 'Ctrl-]', command: 'cmd_indentMore'},
          ]
         },
         {type: 'separator'},
         {type: 'sub', label: 'Beautify',
          items: [
           {label: 'CSS', key: '', command: 'cmd_cssBeautify'},
           {label: 'HTML', key: '', command: 'cmd_htmlBeautify'},
           {label: 'Javascript', key: '', command: 'cmd_jsBeautify'},
          ]
         }
       ]
      },
      {name: 'search', label: 'Search',
       items: [
         {label: 'Find', key: 'Ctrl-F', command: 'cmd_find'},
         {label: 'Find next', key: 'Ctrl-G', command: 'cmd_findNext'},
         {label: 'Find prev', key: 'Shift-Ctrl-G', command: 'cmd_findPrev'},
         {label: 'Replace', key: 'Shift-Ctrl-F', command: 'cmd_replace'},
         {label: 'Replace all', key: 'Shift-Ctrl-R', command: 'cmd_replaceAll'},
       ]
      },
      {name: 'navigate', label: 'Navigate',
       items: [
         {label: 'Go to line', key: 'Alt-G', command: 'cmd_jumpToLine'},
         {type: 'separator'},
         {label: 'Prev word', key: 'Ctrl-Left', command: 'cmd_goGroupLeft'},
         {label: 'Next word', key: 'Ctrl-Right', command: 'cmd_goGroupRight'},
         {type: 'separator'},
         {label: 'Line start', key: 'Alt-Left', command: 'cmd_goLineStart'},
         {label: 'Line end', key: 'Alt-Right', command: 'cmd_goLineEnd'},
         {type: 'separator'},
         {label: 'File start', key: 'Ctrl-Home', command: 'cmd_goDocStart'},
         {label: 'File end', key: 'Ctrl-End', command: 'cmd_goDocEnd'},
       ]
      },
      {name: 'tools', label: 'Tools',
       items: [
         {label: 'Run Code Linter', key: '', command: 'cmd_toolsShipshape'},
       ]
      },
      {name: 'window', label: 'Window',
       items: [
         {label: 'Toggle terminal panel', key: '', command: 'cmd_toggleTerminalPanel'},
         {label: 'Toggle review panel', key: '', command: 'cmd_toggleReviewPanel'},
         {label: 'Toggle explorer panel', key: '', command: 'cmd_toggleExplorerPanel'},
       ]
      },
      {name: 'help', label: 'Help',
       items: [
         {label: 'Getting started guide', key: '', command: 'cmd_gettingStartedGuide'},
       ]
      },
    ],

    init: function() {
      var _this = this;
      var menuBar = $('#menu-bar');
      var menus = $('#menus');
      $.each(_this.menus, function(i, m) {
        var menuButton = $('<input class="small-button" id="open-' + m.name +
                           '-menu-btn" type="submit" value="' + m.label + '">');
        menuBar.append(menuButton);
        var menu = $('<ul id="'+m.name+'-menu" class="menu-bar-item">');
        if (m.items && m.items.length > 0) {
          _this.addMenuItems(m.items, menu);
        }
        menu.menu().hide();
        menus.append(menu);
        _this.setupMenu(menuButton, menu);
      });
    },

    addMenuItems: function(items, menu) {
      var _this = this;
      $.each(items, function(i, t) {
        if (t.type) {
          if (t.type == 'separator') {
            menu.append($('<li>-</li>'));
          } else if (t.type == 'sub') {
            var li = $('<li>' + t.label + '</li>');
            var ul = $('<ul>');
            if (t.items && t.items.length > 0) {
              _this.addMenuItems(t.items, ul);
            }
            li.append(ul);
            menu.append(li);
          }
        } else {
          var commandAction = '';
          if (t.command && codiad.menu[t.command]) {
            // Return focus to the editor and call the command (since many of the commands
            // only make sense with editor focus)
            commandAction = 'onclick="codiad.active.editor.focus();codiad.menu.' + t.command + '();"';
          }
          menu.append(
            '<li ' + commandAction + '><div style="display: inline;">' + t.label +
            '</div><div style="display: inline; float: right;">' +
            t.key + '</div></li>');
        }
      });
    },

    setupMenu: function(menuButton, menu) {
      menuButton.button().click(function( event ) {
        event.preventDefault();
        if (menu.is(':visible')) {
          menu.hide();
        } else {
          $('.menu-bar-item').hide();
          menu.show().position({
            my: 'left top',
            at: 'left bottom',
            of: this
          });
        }
        $(document).on('click', function() {
          menu.hide();
        });
        return false;
      }).mouseover(function(event) {
        if (!menu.is(':visible')) {
          if ($('.menu-bar-item').is(':visible')) {
            $('.menu-bar-item').hide();
            menu.show().position({
              my: 'left top',
              at: 'left bottom',
              of: this
            });
          }
        }
        $(document).on('click', function() {
          menu.hide();
        });
        return false;
      });
    },

    ////// commands /////////
    cmd_saveFile: function() {
      codiad.active.save();
    },

    cmd_searchFile: function() {
      codiad.filemanager.findFiles(codiad.project.getCurrent());
    },

    cmd_searchText: function() {
      codiad.filemanager.search(codiad.project.getCurrent());
    },

    cmd_nextFile: function() {
      codiad.active.move('down');
    },

    cmd_prevFile: function() {
      codiad.active.move('up');
    },

    cmd_closeFile: function() {
      codiad.active.closeActiveTab();
    },

    cmd_settings: function() {
      codiad.settings.show();
    },

    cmd_toggleExplorerPanel: function() {
      codiad.layout.toggleWest();
    },

    cmd_toggleReviewPanel: function() {
      codiad.layout.toggleEast();
    },

    cmd_toggleTerminalPanel: function() {
      codiad.layout.toggleSouth();
    },

    cmd_gitDiff: function() {
      codiad.review.gitDiff();
    },

    cmd_openProjects: function() {
      codiad.project.list();
    },

    cmd_createProject: function() {
      codiad.project.create(true);
    },

    cmd_gettingStartedGuide: function() {
      window.open("help/", "Codiad Help");
    },

    // Broken commands - it turns out accessing the system clipboard from javascript is surprisingly hard.
    cmd_copy: function() {
      codiad.message.notice("Copying from the menu doesn't work right now; please use the keyboard shortcut instead.");
    },
    cmd_paste: function() {
      codiad.message.notice("Pasting from the menu doesn't work right now; please use the keyboard shortcut instead.");
    },
    cmd_cut: function() {
      codiad.message.notice("Cutting from the menu doesn't work right now; please use the keyboard shortcut instead.");
    },

    // CodeMirror-based commands
    cmd_autocomplete: function() {
      // These are wrapped in closures because codiad.active.editor doesn't necessarily exist yet.
      codiad.active.editor.commands.autocomplete();
    },

    cmd_toggleComment: function() {
      codiad.active.editor.commands.toggleComment();
    },

    cmd_selectAll: function() {
      codiad.active.editor.commands.selectAll();
    },

    cmd_undo: function() {
      codiad.active.editor.commands.undo();
    },

    cmd_redo: function() {
      codiad.active.editor.commands.redo();
    },

    cmd_delGroupAfter: function() {
      codiad.active.editor.commands.delGroupAfter();
    },

    cmd_delGroupBefore: function() {
      codiad.active.editor.commands.delGroupBefore();
    },

    cmd_deleteLine: function() {
      codiad.active.editor.commands.deleteLine();
    },

    cmd_indentAuto: function() {
      codiad.active.editor.commands.indentAuto();
    },

    cmd_indentLess: function() {
      codiad.active.editor.commands.indentLess();
    },

    cmd_indentMore: function() {
      codiad.active.editor.commands.indentMore();
    },

    cmd_cssBeautify: function() {
      codiad.tools.cssBeautify(codiad.active.editor);
    },

    cmd_htmlBeautify: function() {
      codiad.tools.htmlBeautify(codiad.active.editor);
    },

    cmd_jsBeautify: function() {
      codiad.tools.jsBeautify(codiad.active.editor);
    },

    cmd_find: function() {
      codiad.active.editor.commands.find();
    },

    cmd_findNext: function() {
      codiad.active.editor.commands.findNext();
    },

    cmd_findPrev: function() {
      codiad.active.editor.commands.findPrev();
    },

    cmd_replace: function() {
      codiad.active.editor.commands.replace();
    },

    cmd_replaceAll: function() {
      codiad.active.editor.commands.replaceAll();
    },

    cmd_jumpToLine: function() {
      codiad.active.editor.commands.jumpToLine();
    },

    cmd_goGroupLeft: function() {
      codiad.active.editor.commands.goGroupLeft();
    },

    cmd_goGroupRight: function() {
      codiad.active.editor.commands.goGroupRight();
    },

    cmd_goLineStart: function() {
      codiad.active.editor.commands.goLineStart();
    },

    cmd_goLineEnd: function() {
      codiad.active.editor.commands.goLineEnd();
    },

    cmd_goDocStart: function() {
      codiad.active.editor.commands.goDocStart();
    },

    cmd_goDocEnd: function() {
      codiad.active.editor.commands.goDocEnd();
    },

    cmd_kytheJumpToDefinition: function() {
      codiad.kythe.jumpToDefinition(codiad.active.editor);
    },

    cmd_toolsShipshape: function() {
      codiad.shipshape.triggerLint();
    },
  };
})(this, jQuery);
