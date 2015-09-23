/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com) & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $) {

  var codiad = global.codiad;

  $(function() {
    codiad.active.init();
  });

  //////////////////////////////////////////////////////////////////
  //
  // Active Files Component for Codiad
  // ---------------------------------
  // Track and manage buffers of files being edited.
  //
  //////////////////////////////////////////////////////////////////

  codiad.active = {
    ACTIVE_BUFFER_STATUS_CHECK_INTERVAL: 60000,

    controller: 'components/active/controller.php',
    // Path to EditSession instance mapping
    buffers: [],
    // History of opened files
    history: [],

    settings: [],

    editor: null,

    activeBuffer: null,

    codeMirrorDefaultOptions: {
      styleActiveLine: true,
      lineNumbers: true,
      extraKeys: {
        'Ctrl-Space': 'autocomplete',
        'Ctrl-/': 'toggleComment',
        'Tab': function(cm) {
          if (cm.doc.somethingSelected()) {
            return CodeMirror.Pass;
          } else {
            if (cm.getOption('insertSoftTab') === true) {
              cm.execCommand('insertSoftTab');
            } else {
              return CodeMirror.Pass;
            }
          }
        },
        'Ctrl-;': 'jumpToDefinition',
        'Shift-Ctrl-;': 'showInfoCard',
        'Ctrl-F': 'findPersistent',
      },
      showTrailingSpace: true,
      lineWrapping: true,
      autoCloseBrackets: true,
      autoCloseTags: true,
      indentWithTabs: false,
      matchBrackets: true,
      foldGutter: true,
      smartIndent: true,
      gutters: [
        "CodeMirror-linenumbers", "CodeMirror-breakpoints", "CodeMirror-lint-markers",
        "CodeMirror-foldgutter"
      ],
      lint: {
        lintOnChange: false
      },
      highlightSelectionMatches: {
        delay: 300,
        wordsOnly: true
      },
      insertSoftTab: true,
      rulers: [{column: 100, lineStyle: 'dashed'}],
      cursorScrollMargin: 50,
      autoRefresh: {delay: 300},
      showHintOnInput: true,
    },

    modeURL: "js/codemirror/mode/%N/%N.min.js",

    //////////////////////////////////////////////////////////////////
    //
    // Check if a file is open.
    //
    // Parameters:
    //   path - {String}
    //
    //////////////////////////////////////////////////////////////////
    isOpen: function(path) {
      return !!this.buffers[path];
    },

    selectMode: function(filename) {
      var info = CodeMirror.findModeByFileName(filename);
      var mode, spec;
      if (info) {
        mode = info.mode;
        spec = info.mime;
      } else {
        mode = null;
        spec = 'text/plain';
      }
      CodeMirror.autoLoadMode(this.editor, mode);
      this.editor.setOption('mode', spec);
      this.showMode(spec);
      return spec;
    },

    getFileName: function(path) {
      return path.substring(path.lastIndexOf('/') + 1);
    },

    /**
    * Checks the status of a buffer associated with path on the server and shows a
    * toast warning message when it has been changed on the server side.
    */
    checkFileStatus: function(path) {
      var _this = this;
      // Get the file info from filemanager
      codiad.filemanager.fileInfo(path, function(info) {
        var relatedBuffer = _this.buffers[path];
        relatedBuffer.tabThumb.removeClass('file-status-changed');
        relatedBuffer.tabThumb.find('.label').prop('title', path);
        info = $.parseJSON(info);
        if (info.status === 'error') {
          console.log('File "'+ path +'" does not exist on the server. ' +
                      'Message from server: "' + info.message + '"');
          relatedBuffer.tabThumb.addClass('file-status-changed');
        } else if (info.status === 'success') {
          var tabTitle = relatedBuffer.tabThumb.find('.label').prop('title');
          if (!info.data.file_info.exists) {
            relatedBuffer.tabThumb.find('.label').prop(
              'title', tabTitle + '  "File does not exist on the server."');
            relatedBuffer.tabThumb.addClass('file-status-changed');
          } else if (info.data.file_info.sha1 !== relatedBuffer.sha1) {
            relatedBuffer.tabThumb.find('.label').prop(
              'title',
              tabTitle +'  "File has been modified on the server. Try to reload the file."');
            relatedBuffer.tabThumb.addClass('file-status-changed');
          } else if (!info.data.file_info.in_current_project) {
            relatedBuffer.tabThumb.find('.label').prop(
              'title', tabTitle + '  "File does not belong to the current project."');
            relatedBuffer.tabThumb.addClass('file-status-changed');
          }
        }
      });
    },

    changeBuffer: function(path) {
      this.activeBuffer = this.buffers[path];
      this.editor.swapDoc(this.activeBuffer.doc);
      this.editor.setOption('readOnly', this.activeBuffer.readonly);
      this.cursorTracking(this.activeBuffer.doc);
      this.checkFileStatus(path);
      split = this.splitDirectoryAndFileName(path);
      $('#current-file').html(
        '<span style="color:grey;">' + split.directory +
        '</span>' + split.fileName);
      this.selectMode(this.getFileName(path));
      CodeMirror.commands.clearSearch(this.editor);
    },

    newDoc: function(content) {
      var d = CodeMirror.Doc(content);
      this.changeListener(d);
      return d;
    },

    /**
     * fileData{ path, content, mtime, sha1 }
     */
    open: function(fileData, focus, readonly, cursorOffset) {
      var _this = this;
      var path = fileData.path;
      var content = fileData.content;
      var mtime = fileData.mtime;
      $('#root-editor-wrapper').show();
      if (focus === undefined) {
        focus = true;
      }
      if (readonly === undefined) {
        readonly = false;
      }
      if (this.isOpen(path)) {
        if(focus) {
          this.focus(path);
          if (cursorOffset) {
            this.moveCursor(cursorOffset);
          }
        }
        return;
      }
      // TODO: Ask for user confirmation before recovering
      // And maybe show a diff
      var draft = this.checkDraft(path);
      if (draft) {
        content = draft;
        codiad.message.success(i18n('Recovered unsaved content for: ') + path);
      }

      var doc = this.newDoc(content);
      var buffer = {
        'doc': doc, 'path': path, 'serverMTime': mtime,
        'sha1': fileData.sha1, 'untainted': content.slice(0),
        'changed': false, 'readonly': readonly
      };
      this.buffers[path] = buffer;
      this.add(path, buffer, focus);
      this.focus(path);
      if (cursorOffset) {
        this.moveCursor(cursorOffset);
      }
      this.editor.refresh();
      /* Notify listeners. */
      amplify.publish('active.onOpen', path);
    },

    moveCursor: function(cursorOffset) {
      var position = this.editor.posFromIndex(cursorOffset);
      this.editor.setCursor(position);
      this.editor.scrollIntoView(position, 150);
      var doc = this.editor.getDoc();
      doc.addLineClass(position.line, 'gutter', 'line-focused');
      window.setTimeout(function() {
        doc.removeLineClass(position.line, 'gutter', 'line-focused');
      }, 4000);
    },

    applySettings: function() {
      var _this = this;
      $.each(
        ['theme', 'lineWrapping', 'lineNumbers', 'indentUnit',
         'smartIndent', 'tabSize', 'indentWithTabs', 'keyMap',
         'styleActiveLine', 'extraKeys', 'showTrailingSpace',
         'autoCloseBrackets', 'autoCloseTags', 'matchBrackets',
         'insertSoftTab', 'rulers', 'showHintOnInput'
        ],
        function(idx, key) {
          var localValue =
              localStorage.getItem('codiad.settings.editor.' + key);
          if (localValue !== null) {
            if (localValue === "false" || localValue === "true") {
              localValue = (localValue === "true");
            } else if (!isNaN(localValue)) {
              localValue = parseFloat(localValue);
            } else if (key === 'rulers') {
              localValue = JSON.parse(localValue);
            }
            _this.editor.setOption(key, localValue);
            _this.settings[key] = localValue;
          } else {
            if (!_this.codeMirrorDefaultOptions[key]) {
              _this.codeMirrorDefaultOptions[key] = CodeMirror.defaults[key];
            }
            _this.editor.setOption(key, _this.codeMirrorDefaultOptions[key]);
            _this.settings[key] = _this.codeMirrorDefaultOptions[key];
          }
        });
      this.handleVisibleTabsSetting();
    },

    handleVisibleTabsSetting: function() {
      var visibleTabs = localStorage.getItem('codiad.settings.editor.visibleTabs');
      if (visibleTabs !== null) {
        visibleTabs = (visibleTabs === 'true');
      } else {
        visibleTabs = true;
      }
      $('body').ready(function() {
        if (visibleTabs) {
          if ($('#cm-visible-tab-css').length === 0) {
            // The following css rule will be inserted into the body so that it decorates the tabs.
            // This css is essentially an image of an arrow representing a tab.
            var visibleTabsCSS = Handlebars.compile($("#cm-tab-visible-css-hb-template").html());
            $('body').append($(visibleTabsCSS()));
          }
        } else {
          // Remove the css from body so in order to make tabs invisible.
          $('#cm-visible-tab-css').remove();
        }
      });
    },

    setupCodeMirror: function() {
      CodeMirror.modeURL = this.modeURL;
      CodeMirror.commands.autocomplete = function(cm) {
        cm.showHint({hint: CodeMirror.hint.anyword, completeSingle: false});
      };
      CodeMirror.commands.jumpToLine = function(cm) {
        function dialog(cm, text, shortText, deflt, f) {
          if (cm.openDialog) cm.openDialog(text, f, {value: deflt});
          else f(prompt(shortText, deflt));
        }
        function validateQuery(query) {
          if (/\d+/.test(query)) return true;
          return false;
        }
        var queryDialog =
            'Go to Line :  <input type="text" style="width: 10em"/> ' +
            '<span style="color: #888">(Press Enter)</span>';

        function goToLine(cm) {
          dialog(cm, queryDialog, "Go to Line:", 0, function(query) {
            if (validateQuery(query)) {
              var line = parseInt(query);
              line = line -1;
              cm.setCursor({line:line,ch:0});
              var myHeight = cm.getScrollInfo().clientHeight;
              var coords = cm.charCoords({line: line, ch: 0}, "local");
              cm.scrollTo(null, (coords.top + coords.bottom - myHeight) / 2);
            }
          });
        }
        goToLine(cm);
      };
      CodeMirror.commands.jumpToDefinition = function(cm) {
        codiad.kythe.jumpToDefinition(cm);
      };
      CodeMirror.commands.showInfoCard = function(cm) {
        codiad.kythe.showInfoCard(cm);
      };
      CodeMirror.keyMap.default["Alt-G"] = "jumpToLine";
    },

    // Allow more convenient access to editor commands.
    populateEditorCommands: function () {
      this.editor.commands = {};
      for (var commandName in CodeMirror.commands) {
        this.editor.commands[commandName] =
          CodeMirror.commands[commandName].bind(undefined, this.editor);
      }
    },

    init: function() {
      var _this = this;
      amplify.subscribe('settings.loaded', this, this.applySettings);
      amplify.subscribe('settings.save', this, this.applySettings);
      codiad.settings.load();
      this.setupCodeMirror();
      this.editor = CodeMirror(document.getElementById('root-editor-wrapper'),
                               _this.codeMirrorDefaultOptions);
      this.editor.on('inputRead', function(cm, changeObj) {
        if (_this.settings.showHintOnInput && changeObj.origin === '+input' &&
            changeObj.text[0] !== ' ') {
          CodeMirror.commands.autocomplete(cm);
        }
      });
      this.applySettings();
      this.populateEditorCommands();

      $('#root-editor-wrapper').hide();
      var er = $('#editor-region');
      er.on('e-resize-init', function(){
        _this.resizeHandler();
      });

      _this.initTabDropdownMenu();
      _this.updateTabDropdownVisibility();

      // Focus on left button click from dropdown.
      $(document).on('click', '#dropdown-list-active-files a', function(e) {
        if(e.which == 1) {
          /* Do not stop propagation of the event,
              * it will be catch by the dropdown menu
              * and close it. */
          _this.focus($(this).parent('li').attr('data-path'));
        }
      });

      // Focus on left button mousedown from tab.
      $(document).on('mousedown', '#tab-list-active-files li.tab-item>a.label',
                     function(e) {
        if(e.which == 1) {
          e.stopPropagation();
          _this.focus($(this).parent('li').attr('data-path'));
        }
      });

      // Remove from dropdown.
      $(document).on('click', '#dropdown-list-active-files a>span', function(e) {
        e.stopPropagation();
        var pathToRemove = $(this).parents('li').attr('data-path');
        _this.closeTab(pathToRemove);
      });

      // Remove a tab.
      $(document).on('click', '#tab-list-active-files a.close', function(e) {
        e.stopPropagation();
        var pathToRemove = $(this).parent('li').attr('data-path');
        _this.closeTab(pathToRemove);
      });

      // Remove from middle button click on dropdown.
      $(document).on('mouseup', '#dropdown-list-active-files li', function(e) {
        if (e.which == 2) {
          e.stopPropagation();
          var pathToRemove = $(this).attr('data-path');
          _this.closeTab(pathToRemove);
        }
      });

      // Remove from middle button click on tab.
      $(document).on('mouseup', '.tab-item', function(e) {
        if (e.which == 2) {
          e.stopPropagation();
          var pathToRemove = $(this).attr('data-path');
          _this.closeTab(pathToRemove);
        }
      });

      // Make dropdown sortable.
      $('#dropdown-list-active-files').sortable({
        axis: 'y',
        tolerance: 'pointer',
        start: function(e, ui) {
          ui.placeholder.height(ui.item.height());
        }
      });

      // Make tabs sortable.
      $('#tab-list-active-files').sortable({
        items: '> li',
        axis: 'x',
        tolerance: 'pointer',
        containment: 'parent',
        start: function(e, ui) {
          ui.placeholder.css('background', 'transparent');
          ui.helper.css('width', '200px');
        },
        stop: function(e, ui) {
          // Reset css
          ui.item.css('z-index', '');
          ui.item.css('position', '');
        }
      });

      // Open saved-state active files on load
      $.get(_this.controller + '?action=list', function(data) {
        var listResponse = codiad.jsend.parse(data);
        if (listResponse !== null) {
          $.each(listResponse, function(index, data) {
            codiad.filemanager.openFile(data.path, data.focused);
          });
          // Run resize command to fix render issues
          _this.resizeHandler();
        }
      });

      // Run resize on window resize
      $(window).resize(function() {
        _this.resizeHandler();
      });

      // Prompt if a user tries to close window without saving all filess
      window.onbeforeunload = function(e) {
        var unsaved = false;
        for(var buffer in _this.buffers) {
          if (_this.buffers[buffer].changed) {
            unsaved = true;
            break;
          }
        }
        if (unsaved) {
          var ev = e || window.event;
          var errMsg = i18n('You have unsaved files.');

          // For IE and Firefox prior to version 4
          if (ev) {
            ev.returnValue = errMsg;
          }

          // For rest
          return errMsg;
        }
      };

      // Check the status of the active buffer every 15 seconds and show a message
      // when the file status has been changed on the server.
      setInterval(function() {
        if (_this.activeBuffer) {
          _this.checkFileStatus(_this.activeBuffer.path);
        }
      }, this.ACTIVE_BUFFER_STATUS_CHECK_INTERVAL);
    },

    //////////////////////////////////////////////////////////////////
    // Drafts
    //////////////////////////////////////////////////////////////////

    checkDraft: function(path) {
      var draft = localStorage.getItem(path);
      if (draft !== null) {
        return draft;
      } else {
        return false;
      }
    },

    resizeHandler: function() {
      this.editor.refresh();
      this.updateTabDropdownVisibility();
    },

    changeListener: function(doc) {
      var _this = this;
      doc.on('change', function(cmInstance, changeObject) {
        if (!(changeObject.text && changeObject.removed &&
              changeObject.text.length === changeObject.removed.length === 0)) {
          _this.markChanged(_this.activeBuffer);
        }
      });
    },

    removeDraft: function(path) {
      localStorage.removeItem(path);
    },

    //////////////////////////////////////////////////////////////////
    // Get active editor path
    //////////////////////////////////////////////////////////////////

    getPath: function() {
      if (this.activeBuffer) {
        return this.activeBuffer.path;
      } else {
        return undefined;
      }
    },

    closeActiveTab: function() {
      var p = this.getPath();
      if (p) {
        this.closeTab(p);
      }
    },

    closeTab: function(pathToRemove) {
      /* Get the active editor before removing anything. Remove the
      * tab, then put back the focus on the previously active
      * editor if it was not removed.
      */
      this.remove(pathToRemove);
      this.updateTabDropdownVisibility();
    },

    //////////////////////////////////////////////////////////////////
    // Add newly opened file to list
    //////////////////////////////////////////////////////////////////

    add: function(path, buffer, focus) {
      if (focus === undefined) {
        focus = true;
      }

      /* If the tab list would overflow with the new tab. Move the
          * first tab to dropdown, then add a new tab. */
      if (this.isTabListOverflowed(true)) {
        var tab = $('#tab-list-active-files li:first-child');
        this.moveTabToDropdownMenu(tab);
      }

      var tabThumb = this.createTabThumb(path);
      $('#tab-list-active-files').append(tabThumb);
      buffer.tabThumb = tabThumb;

      this.updateTabDropdownVisibility();

      $.get(this.controller + '?action=add&path=' + path);

      if(focus) {
        this.focus(path);
      }
      // Mark draft as changed
      if (this.checkDraft(path)) {
        this.markChanged(this.buffers[path]);
      }
    },

    //////////////////////////////////////////////////////////////////
    // Focus on opened file
    //////////////////////////////////////////////////////////////////

    focus: function(path, prependToTabList) {
      if (prependToTabList === undefined) {
        prependToTabList = true;
      }
      this.highlightEntry(path, prependToTabList);
      this.changeBuffer(path);
      this.addHistory(path);
      this.editor.focus();
      $.get(this.controller, {'action':'focused', 'path':path});
      /* Notify listeners. */
      amplify.publish('active.onFocus', path);
    },

    highlightEntry: function(path, prependToTabList) {
      if (prependToTabList === undefined) {
        prependToTabList = true;
      }
      $('#tab-list-active-files li').removeClass('active');

      $('#dropdown-list-active-files li').removeClass('active');

      var buffer = this.buffers[path];

      if($('#dropdown-list-active-files').has(buffer.tabThumb).length > 0) {
        /* Get the menu item as a tab, and put the last tab in
         * dropdown.
         */
        var tab;
        if (prependToTabList) {
          tab = $('#tab-list-active-files li:last-child');
        } else {
          tab = $('#tab-list-active-files li:first-child');
        }
        this.moveTabToDropdownMenu(tab, prependToTabList);
        this.moveDropdownMenuItemToTab(buffer.tabThumb, prependToTabList);
      } else if(this.history.length > 0) {
        var prevPath = this.history[this.history.length-1];
        var prevBuffer = this.buffers[prevPath];
        if($('#dropdown-list-active-files').has(prevBuffer.tabThumb).length > 0) {
          /* Hide the dropdown menu if needed */
          this.hideTabDropdownMenu();
        }
      }
      buffer.tabThumb.addClass('active');
    },

    //////////////////////////////////////////////////////////////////
    // Mark changed
    //////////////////////////////////////////////////////////////////

    markChanged: function(buffer) {
      if (!buffer.changed) {
        buffer.changed = true;
        buffer.tabThumb.addClass('changed');
      }
    },

    clearChanged: function(buffer) {
      buffer.changed = false;
      if (buffer.tabThumb) buffer.tabThumb.removeClass('changed');
    },

    //////////////////////////////////////////////////////////////////
    // Save active editor
    //////////////////////////////////////////////////////////////////

    save: function(path) {
      /* Notify listeners. */
      amplify.publish('active.onSave', path);

      var _this = this;
      if ((path && !this.isOpen(path)) || (!path && !this.activeBuffer)) {
        codiad.message.error(i18n('No open files to save'));
        return;
      }
      var buffer;
      if (path) buffer = this.buffers[path];
      else buffer = this.activeBuffer;
      var content = buffer.doc.getValue();
      path = buffer.path;

      if (!buffer.changed || buffer.readonly) {
        return;
      }

      var handleSuccess = function(mtime, sha1) {
        if (buffer) {
          buffer.untainted = content;
          buffer.serverMTime = mtime;
          buffer.sha1 = sha1;
          _this.clearChanged(buffer);
          amplify.publish('active.saved', path);
        }
        _this.removeDraft(path);
      };

      codiad.filemanager.saveFile(path, content, {
        success: handleSuccess
      });
    },

    //////////////////////////////////////////////////////////////////
    // Save all files
    //////////////////////////////////////////////////////////////////
    saveAll: function() {
      var _this = this;
      for(var buffer in _this.buffers) {
        if (_this.buffers[buffer].changed) {
          codiad.active.save(buffer);
        }
      }
    },

    //////////////////////////////////////////////////////////////////
    // Remove file
    //////////////////////////////////////////////////////////////////
    remove: function(path, promptChanged) {
      if (promptChanged === undefined) {
        promptChanged = true;
      }
      if (!this.isOpen(path)) return;
      var buffer = this.buffers[path];
      var closeFile = true;
      if (promptChanged && buffer.changed) {
        codiad.modal.load(450, 'components/active/dialog.php?action=confirm&path=' + path);
        closeFile = false;
      }
      if (closeFile) {
        this.close(path);
      }
    },

    removeWithPath: function(path, isDirectory) {
      if (!isDirectory) {
        this.remove(path, false);
      } else {
        path = path + "/";
        for (var p in this.buffers) {
          if (p.indexOf(path) === 0) {
            this.remove(p, false);
          }
        }
      }
    },

    exterminate: function() {
      $('#root-editor-wrapper').hide();
      $('#current-file').html('');
      $('#current-mode').html('');
      this.buffers = {};
      this.activeBuffer = null;
    },

    removeAll: function(discard) {
      discard = discard || false;
      /* Notify listeners. */
      amplify.publish('active.onRemoveAll');

      var _this = this;
      var changed = false;
      var opentabs = [];
      for(var buffer in _this.buffers) {
        opentabs.push(buffer); // pushes the path
        if (_this.buffers[buffer].changed) {
          changed = true;
        }
      }
      if (changed && !discard) {
        codiad.modal.load(450, 'components/active/dialog.php?action=confirmAll');
        return;
      }
      opentabs.forEach(function(tab, i) {
        var buffer = _this.buffers[tab];

        buffer.tabThumb.remove();
        _this.updateTabDropdownVisibility();

        /* Remove closed path from history */
        _this.removeHistory(tab);
        delete _this.buffers[tab];
        _this.removeDraft(tab);
      });

      _this.exterminate();
      $.get(_this.controller + '?action=removeall');
    },

    removeHistory: function(p) {
      var history = [];
      $.each(this.history, function(index) {
        if(this != p) history.push(this);
      });
      this.history = history;
    },

    addHistory: function(p) {
      if (this.history.length > 0) {
        if (this.history[this.history.length - 1] === p) {
          return;
        }
      }
      this.history.push(p);
    },

    close: function(path) {
      /* Notify listeners. */
      amplify.publish('active.onClose', path);

      var _this = this;
      var buffer = _this.buffers[path];

      /* Animate only if the tabThumb if a tab, not a dropdown item. */
      if(buffer.tabThumb.hasClass('tab-item')) {
        buffer.tabThumb.css({'z-index': 1});
        buffer.tabThumb.fadeOut(300, function() {
          buffer.tabThumb.remove();
          _this.updateTabDropdownVisibility();
        });
      } else {
        buffer.tabThumb.remove();
        _this.updateTabDropdownVisibility();
      }

      /* Remove closed path from history */
      _this.removeHistory(path);
      /* Select all the tab tumbs except the one which is to be removed. */
      var tabThumbs = $('#tab-list-active-files li[data-path!="' + path + '"]');

      if (tabThumbs.length === 0 || _this.history.length === 0) {
        _this.exterminate();
      } else if (_this.history.length > 0) {
        var nextPath = _this.history[_this.history.length - 1];
        _this.focus(nextPath);
      }
      delete _this.buffers[path];
      $.get(_this.controller + '?action=remove&path=' + path);
      _this.removeDraft(path);
    },

    showMode: function(mode) {
      if (mode) {
        $('#current-mode').html(mode);
      } else {
        $('#current-mode').html('text/plain');
      }
    },

    //////////////////////////////////////////////////////////////////
    // Process rename
    //////////////////////////////////////////////////////////////////

    rename: function(oldPath, newPath) {
      var _this = this;
      var switchBuffers = function(oldPath, newPath) {
        var tabThumb = _this.buffers[oldPath].tabThumb;
        tabThumb.attr('data-path', newPath);
        var splitFileName = this.splitDirectoryAndFileName(newPath);
        tabThumb.find('.label').html(splitFileName.directory + '<span class="file-name">' +
                                     splitFileName.fileName + '</span>');
        tabThumb.find('.label').prop('title', newPath);
        _this.buffers[newPath] = _this.buffers[oldPath];
        _this.buffers[newPath].path = newPath;
        if (_this.activeBuffer.path === oldPath) {
          _this.activeBuffer = _this.buffers[newPath];
        }
        delete _this.buffers[oldPath];
        //Rename history
        for (var i = 0; i < _this.history.length; i++) {
          if (_this.history[i] === oldPath) {
            _this.history[i] = newPath;
          }
        }
      };
      if (_this.buffers[oldPath]) {
        // A file was renamed
        switchBuffers.apply(this, [oldPath, newPath]);
        var newBuffer = _this.buffers[newPath];

        // Assuming the mode file has no dependencies
        var oldDoc = newBuffer.doc;
        newBuffer.doc = _this.newDoc(oldDoc.getValue());
        newBuffer.doc.setHistory(oldDoc.getHistory());
        newBuffer.doc.setCursor(oldDoc.getCursor());
      } else {
        // A folder was renamed
        var newKey;
        for (var key in _this.buffers) {
          newKey = key.replace(oldPath, newPath);
          if (newKey !== key) {
            switchBuffers.apply(this, [key, newKey]);
          }
        }
      }
      $.get(_this.controller + '?action=rename&old_path=' + oldPath + '&new_path=' + newPath,
            function() {
        /* Notify listeners. */
        amplify.publish('active.onRename', {"oldPath": oldPath, "newPath": newPath});
      });
    },

    //////////////////////////////////////////////////////////////////
    // Open in Browser
    //////////////////////////////////////////////////////////////////

    openInBrowser: function() {
      var _this = this;
      var path = _this.getPath();
      if (path) {
        codiad.filemanager.openInBrowser(path);
      } else {
        codiad.message.error('No open files');
      }
    },

    //////////////////////////////////////////////////////////////////
    // Get Selected Text
    //////////////////////////////////////////////////////////////////

    getSelectedText: function() {
      var _this = this;
      var path = _this.getPath();
      var buffer = _this.buffers[path];

      if (path && _this.isOpen(path)) {
        return buffer.doc.getSelection();
      } else {
        codiad.message.error(i18n('No open files or selected text'));
      }
    },

    cursorTracking: function(doc) {
      if (!doc) return;
      clearInterval(this.cursorPoll);
      this.cursorPoll = setInterval(function() {
        var cursorPos = doc.getCursor();
        $('#cursor-position').html(
          'Ln: ' + (cursorPos.line + 1) +
          ' &middot; Col: ' + (cursorPos.ch + 1));
      }, 100);
    },

    //////////////////////////////////////////////////////////////////
    // Insert Text
    //////////////////////////////////////////////////////////////////
    insertText: function(val) {
      this.activeBuffer.doc.replaceRange(val, this.activeBuffer.doc.getCursor());
    },

    //////////////////////////////////////////////////////////////////
    // Goto Line
    //////////////////////////////////////////////////////////////////
    // Input line is one based.
    gotoLine: function(line) {
      this.activeBuffer.doc.setCursor(line - 1, 0);
    },

    //////////////////////////////////////////////////////////////////
    // Move Up (Key Combo)
    //////////////////////////////////////////////////////////////////

    move: function(dir) {

      var num = $('#tab-list-active-files li').length;
      if (num === 0) return;
      var newActive = null;
      var active = null;
      if (dir == 'up') {
        // If active is in the tab list
        active = $('#tab-list-active-files li.active');
        if(active.length > 0) {
          // Previous or rotate to the end
          newActive = active.prev('li');
          if (newActive.length === 0) {
            newActive = $('#dropdown-list-active-files li:last-child');
            if (newActive.length === 0) {
              newActive = $('#tab-list-active-files li:last-child');
            }
          }
        }
        // If active is in the dropdown list
        active = $('#dropdown-list-active-files li.active');
        if(active.length > 0) {
          // Previous
          newActive = active.prev('li');
          if (newActive.length === 0) {
            newActive = $('#tab-list-active-files li:last-child');
          }
        }

      } else {
        // If active is in the tab list
        active = $('#tab-list-active-files li.active');
        if(active.length > 0) {
          // Next or rotate to the beginning
          newActive = active.next('li');
          if (newActive.length === 0) {
            newActive = $('#dropdown-list-active-files li:first-child');
            if (newActive.length === 0) {
              newActive = $('#tab-list-active-files li:first-child');
            }
          }
        }

        // If active is in the dropdown list
        active = $('#dropdown-list-active-files li.active');
        if(active.length > 0) {
          // Next or rotate to the beginning
          newActive = active.next('li');
          if (newActive.length === 0) {
            newActive = $('#tab-list-active-files li:first-child');
          }
        }

      }

      if(newActive) this.focus(newActive.attr('data-path'), dir === 'up');
    },

    //////////////////////////////////////////////////////////////////
    // Dropdown Menu
    //////////////////////////////////////////////////////////////////

    initTabDropdownMenu: function() {
      var _this = this;
      var menu = $('#dropdown-list-active-files');
      var button = $('#tab-dropdown-button');
      var closebutton = $('#tab-close-button');

      button.click(function(e) {
        e.stopPropagation();
        _this.toggleTabDropdownMenu();
      });
      closebutton.click(function(e) {
        e.stopPropagation();
        _this.removeAll();
      });
    },

    showTabDropdownMenu: function() {
      var menu = $('#dropdown-list-active-files');
      if(!menu.is(':visible')) this.toggleTabDropdownMenu();
    },

    hideTabDropdownMenu: function() {
      var menu = $('#dropdown-list-active-files');
      if(menu.is(':visible')) this.toggleTabDropdownMenu();
    },

    toggleTabDropdownMenu: function() {
      var _this = this;
      var menu = $('#dropdown-list-active-files');
      menu.css({
        top: $("#editor-top-bar").height() + 'px',
        right: '20px',
        width: '200px'
      });
      menu.slideToggle('fast');

      if(menu.is(':visible')) {
        // handle click-out autoclosing
        var fn = function() {
          menu.hide();
          $(window).off('click', fn);
        };
        $(window).on('click', fn);
      }
    },

    moveTabToDropdownMenu: function(tab, prepend) {
      if (prepend === undefined) {
        prepend = false;
      }

      tab.remove();
      path = tab.attr('data-path');

      var tabThumb = this.createMenuItemThumb(path);
      if(prepend) $('#dropdown-list-active-files').prepend(tabThumb);
      else $('#dropdown-list-active-files').append(tabThumb);

      if(tab.hasClass("changed")) {
        tabThumb.addClass("changed");
      }

      if(tab.hasClass("active")) {
        tabThumb.addClass("active");
      }

      this.buffers[path].tabThumb = tabThumb;
    },

    moveDropdownMenuItemToTab: function(menuItem, prepend) {
      if (prepend === undefined) {
        prepend = false;
      }

      menuItem.remove();
      path = menuItem.attr('data-path');

      var tabThumb = this.createTabThumb(path);
      if(prepend) $('#tab-list-active-files').prepend(tabThumb);
      else $('#tab-list-active-files').append(tabThumb);

      if(menuItem.hasClass("changed")) {
        tabThumb.addClass("changed");
      }

      if(menuItem.hasClass("active")) {
        tabThumb.addClass("active");
      }

      this.buffers[path].tabThumb = tabThumb;
    },

    isTabListOverflowed: function(includeFictiveTab) {
      if (includeFictiveTab === undefined) {
        includeFictiveTab = false;
      }

      var tabs = $('#tab-list-active-files li');
      var count = tabs.length;
      if (includeFictiveTab) count += 1;
      if (count <= 1) return false;

      var oneTabWidth = $(tabs[0]).width();
      var width = count * oneTabWidth;
      var tabListWidth = $("#tab-list-active-files").width();
      var dropdownWidth = $('#tab-dropdown').width();
      var closeWidth = $('#tab-close').width();
      var room = tabListWidth - dropdownWidth - closeWidth - width;
      return (room < 50);
    },

    updateTabDropdownVisibility: function() {
      while(this.isTabListOverflowed()) {
        var tab = $('#tab-list-active-files li:last-child');
        if (tab.length == 1) this.moveTabToDropdownMenu(tab, true);
        else break;
      }

      while(!this.isTabListOverflowed(true)) {
        var menuItem = $('#dropdown-list-active-files li:first-child');
        if (menuItem.length == 1) this.moveDropdownMenuItemToTab(menuItem);
        else break;
      }

      if ($('#dropdown-list-active-files li').length > 0) {
        $('#tab-dropdown').show();
      } else {
        $('#tab-dropdown').hide();
        // Be sure to hide the menu if it is opened.
        $('#dropdown-list-active-files').hide();
      }
      if ($('#tab-list-active-files li').length > 1) {
        $('#tab-close-button').show();
      } else {
        $('#tab-close-button').hide();
      }
    },

    //////////////////////////////////////////////////////////////////
    // Factory
    //////////////////////////////////////////////////////////////////
    splitDirectoryAndFileName: function(path) {
      var index = path.lastIndexOf('/');
      return {
        fileName: path.substring(index + 1),
        directory: (path.indexOf('/') === 0)? path.substring(1, index + 1):path.substring(0, index + 1)
      };
    },

    createListThumb: function(path) {
      return $('<li data-path="' + path + '"><a title="'+path+'"><span></span><div>' + path + '</div></a></li>');
    },

    createTabThumb: function(path) {
      split = this.splitDirectoryAndFileName(path);
      return $('<li class="tab-item" data-path="' + path + '"><a class="label" title="' + path + '">' +
               split.directory + '<span class="file-name">' + split.fileName + '</span>' +
               '</a><a class="close">x</a></li>');
    },

    createMenuItemThumb: function(path) {
      split = this.splitDirectoryAndFileName(path);
      return $('<li data-path="' + path + '"><a title="' + path +
               '"><span class="label"></span><div class="label">' + split.directory +
               '<span class="file-name">' + split.fileName + '</span>' + '</div></a></li>');
    },

  };

})(this, jQuery);
