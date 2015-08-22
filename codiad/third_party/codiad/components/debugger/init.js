/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $) {

  var codiad = global.codiad;

  $(function() {
    codiad.debugger.init();
  });


  // Utility function to check existence of an element in an array.
  // TODO: In the future, this function can be replaced by 'Array.prototype.findIndex()'
  // when browsers become to support it as part of ECMAScript 2015 standard.
  var findIndexOf = function(array, predicate) {
    var len = array.length;
    for (var i = 0; i < len; ++i) {
      if (predicate(array[i]))
        return i;
    }
    return -1;
  };


  //
  // General debugger framework.
  //
  // The frameworks communicates with debugger stubs (one of which is Cloud Debugger) through
  // a pre-defined interface. As such, any debugger stub can be plugged in as long as they
  // implement the communcation interface.
  //
  codiad.debugger = {

    controller: 'components/debugger/controller.php',
    dialog: 'components/debugger/dialog.php',

    // Breakpoints can be set or deleted by clicks on the gutter area when only in the Debug Mode.
    // (However, existing breakpoints may work normally even if not in the Debug Mode.)
    // We are in the Debug Mode iff 'debuggerStub' is set to a certain debugger.
    debuggerStub: null,

    // Local data structure to hold all breakpoints.
    // Note: It is fine to fail to track and delete every breakpoint. The Cloud Debugger team
    // confirmed that breakpoints take little resource and are garbage-collected eventually
    // whether or not they are captured. In fact, Pantheon can leak undeleted breakpoints, e.g,
    // if a user closes a browser before deleting breakpoints.
    breakpoints: [],

    // Locally unique ID assigned to each breakpoint.
    uid: 1,

    // When set, it implies that 'refreshBreakpoints' are being called periodically.
    refresher: null,

    currentBreakpointRow: null,

    init: function() {
      codiad.debugger.setupEvents();
    },

    toggleDebugMode: function() {
      if (!codiad.debugger.debuggerStub) {
        codiad.modal.load(500, codiad.debugger.dialog, { 'action': 'debug_mode' });
        codiad.modal.load_process.done(function() {
          codiad.debugger.cloudDebugger.prepareDebugModeDialog();
        });
        codiad.modal.hideOverlay();

        $(document).off('submit').on('submit', '#modal-content form', function(e) {
          e.preventDefault();
          var which = $('#modal-content form select[name="which_debugger"]').val();
          if (which === 'cloud_debugger') {
            codiad.debugger.debuggerStub = codiad.debugger.cloudDebugger;
          }
          codiad.debugger.debuggerStub.postDebugModeDialog();

          // Remember that values from the dialog cannot be retrieved after 'unload()'.
          codiad.modal.unload();
          codiad.message.success('Debug Mode enabled. File editing disabled.');
          // This read-only setting has an effect only on the currently visible file in the editor.
          codiad.active.editor.setOption('readOnly', true);
          codiad.active.activeBuffer.readonly = true;
          $('#debug-mode-button').text('Disable Debug Mode');
        });
      } else {
        codiad.debugger.debuggerStub = null;
        codiad.message.success('Debug Mode disabled. File editing enabled.');
        // This read-only setting has an effect only on the currently visible file in the editor.
        codiad.active.editor.setOption('readOnly', false);
        codiad.active.activeBuffer.readonly = false;
        $('#debug-mode-button').text('Enable Debug Mode');
      }
    },

    // Sets up all debugger-related UI events, such as clicks on the breakpoint gutter,
    // breakpoint table, call stack, etc.
    setupEvents: function() {
      var _this = this;

      // Click events on line numbers in the CodeMirror gutter.
      codiad.active.editor.on('gutterClick', _this.onClickLineNum);
      codiad.active.editor.on('gutterContextMenu', _this.onRightClickLineNum);
      codiad.active.editor.on('swapDoc', _this.checkReadOnly);

      // Button clicks for toggling Debug Mode.
      $('#debug-mode-button').click(_this.toggleDebugMode);

      // Click events on the breakpoint table.
      var tblBreakpoints = $('#dbg-pane-breakpoints');
      tblBreakpoints.on('mouseover', '.breakpoint-normal', function() {
        $(this).removeClass('breakpoint-normal').addClass('breakpoint-hovered');
      });
      tblBreakpoints.on('mouseleave', '.breakpoint-hovered', function() {
        $(this).removeClass('breakpoint-hovered').addClass('breakpoint-normal');
      });
      tblBreakpoints.on('click', '.breakpoint-hovered', function() {
        if (_this.currentBreakpointRow !== this) {
          if (_this.currentBreakpointRow) {
            $(_this.currentBreakpointRow).removeClass('breakpoint-selected').addClass('breakpoint-normal');
          }
          _this.currentBreakpointRow = this;
          $(this).removeClass('breakpoint-hovered').addClass('breakpoint-selected');

          _this.showCurrentBreakpointStack();
        }
      });

      // Expanding/collapsing events of stack frames
      var tblStack = $('#dbg-pane-stack');
      tblStack.on('click', '.dbg-stack-frame-head', function() {
        var frame = $(this).parent();
        var handle = $(this).find('.dbg-stack-frame-handle');
        if (handle.hasClass('icon-down-dir')) {
          frame.find('.dbg-stack-frame-details').remove();
          handle.removeClass('icon-down-dir').addClass('icon-right-dir');
        } else {
          _this.expandCurrentStackFrame(frame);
          handle.removeClass('icon-right-dir').addClass('icon-down-dir');
        }
      });

      // Expanding/collapsing arguments and locals that are non-primitives (objects).
      tblStack.on('click', '.dbg-stack-frame-obj-head', function() {
        var obj = $(this).parent();
        var handle = $(this).find('.dbg-stack-frame-handle');
        if (handle.hasClass('icon-down-dir')) {
          $(this).next().remove();
          handle.removeClass('icon-down-dir').addClass('icon-right-dir');
        } else {
          _this.expandObjectVariable(obj);
          handle.removeClass('icon-right-dir').addClass('icon-down-dir');
        }
      });

      // Show tooltip about the Debug Mode immediately upon mouse hover.
      $('#debugger-top-bar .dbg-icon-help').tooltip({ 'show': false });
    },

    // Event handler set up by 'setupEvents()' and called when a line number in the gutter
    // is clicked. This will result in setting or unsetting a breakpoint.
    onClickLineNum: function(cm, n, gutter, event) {
      // Stop if we are not in the Debug Mode, or the fold gutter was clicked.
      if (!codiad.debugger.debuggerStub || gutter === 'CodeMirror-foldgutter') {
        return;
      }

      var info = cm.lineInfo(n);
      var marker = info.gutterMarkers && info.gutterMarkers['CodeMirror-breakpoints'];

      var fullPath = codiad.active.getPath();
      var path = fullPath.substring(fullPath.indexOf('/') + 1);
      var line = info.line + 1; // 0-indexed to 1-indexed.

      if (marker) { // Breakpoint already set. Try unsetting it.
        if (marker.className === 'breakpoint-marker-pending') {
          codiad.message.notice('Pending breakpoint. Please wait until it is set or deleted.');
        } else {
          if (event.which === 3) { // Right mouse-click?
            codiad.message.notice('To change breakpoint conditions, please set a new breakpoint' +
                                  'after deleting the existing one.');
          } else {
            // Set the 'pending' status immediately (synchronous) to prevent race condition.
            codiad.debugger.changeMarker('pending', cm, n);

            codiad.debugger.unsetBreakpoint(path, line, function() {
              codiad.debugger.changeMarker('clear', cm, n);
            });
          }
        }

      } else { // No breakpoint set on this line. Try setting one.
        var proceedToSet = function(cond, exprs) {
          // Set the 'pending' status immediately (synchronous) to prevent race condition.
          codiad.debugger.changeMarker('pending', cm, n);

          codiad.debugger.setBreakpoint(path, line, cond, exprs, function() {
            codiad.debugger.changeMarker('set', cm, n);
          }, function() {
            codiad.debugger.changeMarker('clear', cm, n);
          });
        };

        // Right mouse-click: open a dialog to accept breakpoint conditions and expressions.
        if (event.which === 3) {
          codiad.debugger.openSetBreakpointDialog(path, line, proceedToSet);
        } else {
          proceedToSet('', []); // Without breakpoint conditions or watch expressions.
        }
      }
    },

    // Sets or unsets the read-only option depending on whether in the Debug Mode whenever a user
    // switches documents (including opening a new file, re-opening an existing file, etc).
    checkReadOnly: function(cm) {
      // See 'changeBuffer():active/init.js' to see why using 'activeBuffer.readonly'.
      // Note that the 'readonly' bit is saved per file.
      //
      // TODO: Note that this 'readonly' bit is solely determined by whether we are in the Debug
      // Mode or not. That is, if another component also controls the read-only setting (like this
      // Debugger component), the overriding below will cause interference. Not sure what could
      // a good way to control the read-only setting with different components.
      codiad.active.activeBuffer.readonly = codiad.debugger.debuggerStub !== null;
    },

    // Opens a dialog to accept breakpoint conditions and watch expressions from user.
    openSetBreakpointDialog: function(path, line, callback) {
      codiad.modal.load(500, codiad.debugger.dialog,
                        { 'action': 'set_breakpoint', 'path': path, 'line': line });
      codiad.modal.hideOverlay();
      $(document).off('submit').on('submit', '#modal-content form', function(e) {
        e.preventDefault();
        // Retrieve breakpoint conditions and eval expressions from the dialog.
        var cond = $('#modal-content form input[name="cond"]').val();
        var exprs = [];
        $('#modal-content form input[name="expr"]').each(function(i, input) {
          var val = $(input).val();
          if (val && val.trim()) {
            exprs.push(val.trim());
          }
        });
        codiad.modal.unload();
        callback(cond, exprs);
      });
    },

    // To prevent browsers' context menu from showing up.
    onRightClickLineNum: function(cm, n, gutter, event) {
      event.preventDefault();
    },

    // Changes breakpoint gutter marks.
    changeMarker: function(mark, cm, n) {
      var marker = null;

      if (mark !== 'clear') {
        marker = document.createElement('div');
        marker.innerHTML = '●';

        if (mark === 'set') {
          marker.className = 'breakpoint-marker-set';
        } else if (mark === 'pending') {
          marker.className = 'breakpoint-marker-pending';
        }
      }

      cm.setGutterMarker(n, 'CodeMirror-breakpoints', marker);
    },

    // Find an index for the matching breakpoint in the local data structure
    // when given path and line number.
    findBreakpointIndex: function(path, line) {
      return findIndexOf(codiad.debugger.breakpoints, function(bp) {
        var loc = bp.stub.getBreakpointLoc(bp.bpObj);
        return loc.path === path && loc.line === line;
      });
    },

    unsetBreakpoint: function(path, line, callback) {
      // Find the matching breakpoint in the local data structure. It always exists.
      var idx = codiad.debugger.findBreakpointIndex(path, line);
      var bp = codiad.debugger.breakpoints[idx];

      bp.stub.deleteBreakpoint(bp.bpObj, function() {
        // Success! Let's clear local information. We need to find an index again,
        // since the local data structure may have been updated asynchronously.
        var idx = codiad.debugger.findBreakpointIndex(path, line);
        var bp = codiad.debugger.breakpoints[idx];
        codiad.debugger.breakpoints.splice(idx, 1);
        codiad.debugger.hideBreakpointRow(bp.uid);
        // As a note, although the breakpoint is removed from the local array, the pointer to the
        // breakpoint may still be held inside 'refreshBreakpoints()', which is completely fine.

        callback();
      });
    },

    setBreakpoint: function(path, line, cond, exprs, success_cb, fail_cb) {
      var stub = codiad.debugger.debuggerStub;
      stub.setBreakpoint(path, line, cond, exprs, function(bpObj) {
        var bp = {'uid': codiad.debugger.uid++, 'stub': stub, 'bpObj': bpObj};
        codiad.debugger.displayBreakpointRow(bp);
        codiad.debugger.storeNewBreakpoint(bp);

        success_cb();
      }, fail_cb);
    },

    // Stores the newly set breakpoint in a local data structure. Additionally,
    // kicks polling to refresh Cloud Debugger breakpoints when necessary.
    storeNewBreakpoint: function(bp) {
      codiad.debugger.breakpoints.push(bp);

      // For Cloud Debugger, start polling if necessary.
      if (bp.stub === codiad.debugger.cloudDebugger && codiad.debugger.refresher === null) {
        codiad.debugger.refresher = window.setInterval(codiad.debugger.refreshBreakpoints, 1500);
      }
    },

    // Displays a newly added breakpoint. Pure UI action.
    displayBreakpointRow: function(bp) {
      var loc = bp.stub.getBreakpointLoc(bp.bpObj);
      var type = bp.stub.getDebuggerName();

      var template = Handlebars.compile($('#dbg-pane-breakpoint-row').html());
      var content = {'uid': bp.uid, 'loc': loc, 'type': type};
      var row = $(template(content)).data('breakpoint', bp);

      // Insert this row in a sorted way in terms of path and line number.
      var children = $('#dbg-pane-breakpoints').find('.breakpoint-row');
      for (var i = 0; i < children.length; i++) {
        var bpChild = $(children[i]).data('breakpoint');
        var locChild = bpChild.stub.getBreakpointLoc(bpChild.bpObj);
        if (locChild.path > loc.path || (locChild.path === loc.path && locChild.line > loc.line)) {
          $(children[i]).before(row);
          return;
        }
      }
      // If we reach here, the row should be inserted as a last row.
      $('#dbg-pane-breakpoints').append(row);
    },

    // Removes a deleted breakpiont (and its call stack) from UI. Pure UI action.
    hideBreakpointRow: function(bpUid) {
      $('#dbg-pane-breakpoints').children('.breakpointUid-' + bpUid).remove();

      // Also hide the call stack if it is showing the breakpoint being removed.
      if (codiad.debugger.isBreakpointSelected(bpUid)) {
        codiad.debugger.currentBreakpointRow = null;
        $('#dbg-pane-stack').empty();
      }
    },

    // Displays the call stack when a breakpoint is selected. Pure UI action.
    showCurrentBreakpointStack: function() {
      var bp = $(codiad.debugger.currentBreakpointRow).data('breakpoint');

      var template = Handlebars.compile($('#dbg-pane-stack-template').html());
      var stack = bp.stub.getBreakpointStack(bp.bpObj);

      if (!stack.frames) {
        var status = bp.stub.getBreakpointStatus(bp.bpObj);
        stack.error = status.code === 'error';
        stack.desc = stack.error ? status.desc : 'Breakpoint not hit.';
      }
      $('#dbg-pane-stack').html(template(stack));
    },

    // Expands the frame in a call stack when clicked. Pure UI action.
    expandCurrentStackFrame: function(currentStackFrame) {
      var frameIndex = currentStackFrame.index();
      var bp = $(codiad.debugger.currentBreakpointRow).data('breakpoint');
      var frame = bp.stub.getBreakpointStackFrame(bp.bpObj, frameIndex);

      var template = Handlebars.compile($('#dbg-pane-frame-template').html());
      currentStackFrame.append(template({'frame': frame}));
    },

    // Expands the object variable in a stack frame when clicked. Pure UI action.
    expandObjectVariable: function(obj) {
      // First get a reference (a number) with which a debugger can get all of its fields.
      var objRef = obj.attr("class").match(/\bobjvar-([0-9]+)\b/)[1];
      var bp = $(codiad.debugger.currentBreakpointRow).data('breakpoint');
      var fields = bp.stub.getObjectFields(bp.bpObj, objRef);

      var template = Handlebars.compile($('#dbg-pane-objvar-template').html());
      obj.append(template({'fields': fields}));
    },

    // Body of polling registerd by 'window.setInterval'. Queries and refreshes Cloud Debugger
    // breakpoints that are non-final. Also updates status and call stack in the UI if changed.
    // Automatically stops polling if all breakpoints become final.
    refreshBreakpoints: function() {
      var stopRefresh = true;

      var len = codiad.debugger.breakpoints.length;
      for (var i = 0; i < len; i++) {
        var bp = codiad.debugger.breakpoints[i];

        // Is this breakpoint still not final?
        if (bp.stub.needsRefresh(bp.bpObj)) {
          stopRefresh = false;
          // As a note, because 'getBreakpoint()' below and like operations are asynchronous calls,
          // it is possible that the call may sometimes fail under race condition (which is fine),
          // e.g, if the breakpoint we want to update is deleted ahead by another asynchronous call.
          bp.stub.getBreakpoint(bp.bpObj, codiad.debugger.updateBreakpoint(bp),
                                true); // Ignore non-exsiting breakpoint error for the above reason.
        }
      }

      if (stopRefresh) {
        // Turn off polling if all breakpoints are final.
        window.clearInterval(codiad.debugger.refresher);
        codiad.debugger.refresher = null;
      }
    },

    // Returns a callback for 'getBreakpoint()' that updates a single breakpoint.
    // Called within 'refreshBreakpoints()'.
    updateBreakpoint: function(bp) {
      var oldStatus = bp.stub.getBreakpointStatus(bp.bpObj);
      var oldLoc = bp.stub.getBreakpointLoc(bp.bpObj);

      return function(bpObj) {
        var status = bp.stub.getBreakpointStatus(bpObj);

        // If Cloud Debugger fails to set a breakpoint on a certain line, it either returns an error
        // or changes the line number. For consistency, we will treat the latter case an error.
        var loc = bp.stub.getBreakpointLoc(bpObj);
        var lineChanged = oldLoc.line !== loc.line;
        if (lineChanged) {
          status = bp.stub.forceBreakpointError(
            bp.bpObj, 'No code found at line ' + oldLoc.line + '. Try setting at line ' + loc.line);
        } else {
          // Replace the old breakpoint object with a new one.
          bp.bpObj = bpObj;
        }

        // Update the UI (status and call stack).
        if (lineChanged || status.code !== oldStatus.code) {
          var str = status.code === 'hit' ? 'Hit' : (status.code === 'error' ? 'Error' : status.code);
          $('#dbg-pane-breakpoints').children('.breakpointUid-' + bp.uid).children('.breakpoint-status').text(str);

          if (codiad.debugger.isBreakpointSelected(bp.uid)) {
            codiad.debugger.showCurrentBreakpointStack();
          }
        }
      };
    },

    isBreakpointSelected: function(bpUid) {
      return $(codiad.debugger.currentBreakpointRow).hasClass('breakpointUid-' + bpUid);
    },
  };


  //
  // Cloud Debugger Stub.
  //
  codiad.debugger.cloudDebugger = {

    // Id of a debuggee that matches the current source revision. The id identifies and designates
    // the target application being debugged. The id is automatically set when a user enters
    // the Debug Mode (precisely by 'postDebugModeDialog()').
    //
    // The id is used only when setting a new breakpoint; once a breakpoint is created, this id
    // will be recorded in the breakpoint structure itself, so that the recorded id can be used
    // later to get or delete that breakpoint. The rationale behind this is that breakpoints
    // created with different debuggees can coexist (though this would not a usual use case).
    //
    // TODO: Invalidate this id and get out of the Debug Mode whenever there is a change to
    // current commit id, repository or project.
    debuggeeId: null,

    // Called when the Debug Mode dialog is submitted (enabling the Debug Mode).
    postDebugModeDialog: function() {
      this.debuggeeId = $('#modal-content form select[name="which_debuggee"]').val();
    },

    // Calls the backend to find an id of a debuggee that matches the current source revision.
    // Upon success, notifies the dialog so that users can proceed to enter the Debug Mode.
    prepareDebugModeDialog: function() {
      this.debuggeeId = null;
      var selectInput = $('#modal-content form select[name="which_debuggee"]');

      var fail_cb = function() {
        selectInput.empty();
        // TODO: UI messages in this file are not i18n'ed.
        selectInput.append($('<option></option>').attr('value', 'disable_submit').text(
          'Failed to retrieve debuggees in the project.'));
      };

      var repoName = $('#modal-content form input[name="repo_name"]').val();
      var revisionId = $('#modal-content form input[name="revision_id"]').val();

      // Try to get a debuggee id for this repo and code revision.
      $.get(codiad.debugger.controller, { 'action': 'get_debuggee',
                                          'repo_name': repoName, 'revision_id': revisionId },
            function(data) {
        selectInput.empty();
        var response = codiad.jsend.parse(data);
        if (response && response !== 'error') {
          if (!response.id) {
            selectInput.append($('<option></option>').attr('value', 'disable_submit').text(
              'Automatic selection failed. You may pick a debuggee manually.'));
          }

          // List all available debuggees in the dialog whether or not we succeeded to find
          // a matching debuggee. In case of failure, a user will have an option to select
          // a debuggee manually at her own risk of not debugging the right target.
          //
          // TODO: Consider listing only debuggees for this repository. However, one disadvantage
          // of not listing all debuggees in the project is that if a debuggee does not have
          // 'sourceContext' information (e.g, because a user failed to setup Cloud Debugger
          // properly), then such debuggees would not be listed at all.
          response.list.forEach(function(debuggee) {
            var option = $('<option></option>').attr('value', debuggee.id).text(debuggee.description);
            if (debuggee.id === response.id) {
              // For a matching debuggee, pre-select this option in the UI.
              option.attr('selected', 'selected');
              option.text(option.text() + ' (auto-selected)');
              // Also enable the submit button.
              $('#modal-content button:disabled').prop('disabled', false);
            }
            selectInput.append(option);
          });
        } else {
          fail_cb();
        }
      }, 'text').fail(fail_cb);
    },

    getDebuggerName: function() {
      return "Cloud Debugger";
    },

    getBreakpointLoc: function(breakpoint) {
      return {'path': breakpoint.location.path, 'line': breakpoint.location.line};
    },

    // Formats a description string with supplied parameters, e.g, 'No code at line $0'
    // where the value for $0 is 62 will result in 'No code at line 62'.
    //
    // TODO: The current implementation for formatting is not perfect but works fine in most
    // cases. It can cause trouble in certain corner cases where the '$' sign followed by numbers
    // should be displayed explicitly. The discover document for Debugger API says that '$$' can
    // be used to denote the '$' sign itself. For example, when the first parameter to
    // replace the placeholder '$1' is '<REPLACED>', then '$$1' should be left unchanged.
    //
    // $$$1 ==> $<REPLACED>
    // $$1  ==> $1
    // $1   ==> <REPLACED>
    //
    // Currently, the formating is done by simple regex replacing. To resolve the above issue,
    // we should probably write a sophisticated routine go over each charater in the string.
    // However, it is very unlikely that a '$' sign itself will be included in a system-generated
    // message for UI display, so it works fine at the moment.
    formatDesc: function(descObj) {
      var desc = descObj.format;
      if (descObj.parameters) {
        descObj.parameters.forEach(function(param, i) {
          // The part after 'i' is to avoid, e.g, picking up $10 when looking for $1.
          var regex = new RegExp('\\$' + i + '([^0-9]|$)');
          desc = desc.replace(regex, param + '$1');
        });
      }
      return desc;
    },

    forceBreakpointError: function(breakpoint, desc) {
      breakpoint.status = {
        isError: true,
        description: {
          format: desc
        }
      };
      breakpoint.isFinalState = true;

      return this.getBreakpointStatus(breakpoint);
    },

    getBreakpointStatus: function(breakpoint) {
      var code = 'notHit';
      var desc = 'Breakpoint not hit.';
      if (breakpoint.stackFrames) {
        code = 'hit';
        desc = 'Breakpoint captured.';
      } else if (breakpoint.status && breakpoint.status.isError) {
        code = 'error';
        desc = this.formatDesc(breakpoint.status.description);
      }
      return {'code': code, 'desc': desc};
    },

    needsRefresh: function(breakpoint) {
      return breakpoint.isFinalState !== true;
    },

    setBreakpoint: function(path, line, cond, exprs, success_cb, fail_cb) {
      $.post(codiad.debugger.controller, { 'action': 'set_breakpoint',
                                           'debuggee_id': this.debuggeeId,
                                           'path': path, 'line': line, 'cond': cond,
                                           'exprs': (exprs && exprs.length !== 0 ? exprs : '[]') },
             function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response !== 'error') {
          success_cb(response);
        } else {
          fail_cb();
        }
      }, 'text').fail(fail_cb);
    },

    deleteBreakpoint: function(breakpoint, callback) {
      $.get(codiad.debugger.controller, { 'action': 'delete_breakpoint',
                                          'did': breakpoint.debuggeeId, 'bid': breakpoint.id },
            function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response !== 'error') {
          callback();
        }
      }, 'text');
    },

    // Queries and gets a breakpoint. For the usage of 'ignoreNotFoundErr',
    // consult the comments inside 'codiad.debugger.refreshBreakpoints()'.
    getBreakpoint: function(breakpoint, callback, ignoreNotFoundErr) {
      $.get(codiad.debugger.controller, { 'action': 'get_breakpoint',
                                          'did': breakpoint.debuggeeId, 'bid': breakpoint.id,
                                          'ignore_err': ignoreNotFoundErr ? 'true' : '' },
            function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response !== 'error') {
          callback(response);
        }
      }, 'text');
    },

    getBreakpointStack: function(breakpoint) {
      return { 'frames': breakpoint.stackFrames,
               'condition': breakpoint.condition,
               'evalExprs': breakpoint.evaluatedExpressions,
               'userExprs': breakpoint.expressions };
    },

    getBreakpointStackFrame: function(breakpoint, frameIndex) {
      var frame = breakpoint.stackFrames[frameIndex];
      if (frame) {
        this.compileObjects(frame.arguments);
        this.compileObjects(frame.locals);
      }
      return frame;
    },

    // Sets 'isObj' or 'isError' flag on this variable in a stack frame if not already done.
    // If the variable is a reference to an object, 'isObj' should be set so that UI can properly
    // add a handle for expanding/collapsing its fields.
    compileObjects: function(variable) {
      var _this = this;

      if (variable && !variable.examined) {
        variable.examined = true;
        variable.forEach(function(elem){
          elem.isObj = elem.varTableIndex ? true : false;

          // For Cloud Debugger, it often does not contain any more information than a name.
          // In this case, 'status' exists and 'status.description.format' will describe details,
          // such as "Object does not have fields".
          if (elem.status) {
            elem.isError = true;
            elem.value = _this.formatDesc(elem.status.description);
          }
        });
      }
    },

    // Returns a list of fields of the an object (given by a reference).
    getObjectFields: function(breakpoint, objRef) {
      // For Cloud Debugger, the actual object referenced by a reference (a number as an index)
      // is found in the 'variableTable' array.
      var members = breakpoint.variableTable[objRef].members;
      this.compileObjects(members);
      return members;
    },
  };
})(this, jQuery);
