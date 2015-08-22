/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){
  $(function() {
    codiad.review.init();
  });

  codiad.review = {

    controller: 'components/review/controller.php',
    dialog: 'components/review/dialog.php',

    discussions: [],
    editors: [],

    init: function() {
      var _this = this;
      $('#review-content').on('e-resize-init', function(){
        _this.refreshEditors();
      });
      _this.applyEditorSettings();
      amplify.subscribe('settings.save', _this, _this.applyEditorSettings);
    },

    applyEditorSettings: function() {
      var editorTheme = this.getEditorTheme();
      this.editors.forEach(function(ed) {
        ed.setOption('theme', editorTheme);
      });
    },

    getEditorTheme: function() {
      var editorTheme = localStorage.getItem('codiad.settings.editor.theme');
      if (!editorTheme) {
        editorTheme = 'default';
      }
      return editorTheme;
    },

    splitDirectoryAndFileName: function(path) {
      var index = path.lastIndexOf('/');
      return {
        fileName: path.substring(index + 1),
        directory: (path.indexOf('/') === 0) ?
        path.substring(1, index + 1) : path.substring(0, index + 1)
      };
    },

    groupByPath: function(results) {
      var discussions = {};
      $.each(results, function(i, r) {
        if (!r.location) {
          if (!discussions[""]) {
            discussions[""] = [];
          }
          discussions[""].push(r);
        }
        else {
          if (!discussions[r.location.path]) {
            discussions[r.location.path] = [];
          }
          discussions[r.location.path].push(r);
        }
      });
      return discussions;
    },

    showSnippetThread: function(d) {
      var _this = this;
      var commentBox = $('<div class="comment-box">');
      $('#code-comments').append(commentBox);
      var codeSnippetDiv = $('<div class="review-code-snippet-div">').get(0);

      var split = _this.splitDirectoryAndFileName(d.location.path);
      $(codeSnippetDiv).append(
        $('<div class="comment-file-info"><a class="label" title="' +
          d.location.path + '">' + split.directory +
          '<span class="file-name">' + split.fileName + '</span>' +
          '</a><span style="float: right;">' +
          d.location.commit.substring(0, 12) + '</span></div>'));

      commentBox.append(codeSnippetDiv);
      var modeInfo = CodeMirror.findModeByFileName(d.location.path);
      var modeName = modeInfo ? modeInfo.mode : null;
      var editor = CodeMirror(codeSnippetDiv, {
        firstLineNumber: d.snippet.start,
        lineNumbers: true,
        mode: modeName,
        matchBrackets: true,
        lineWrapping: true,
        readOnly: true,
        value: d.snippet.code,
        theme: _this.getEditorTheme()
      });

      // Because it is possible to comment on an older version of a file in phabricator
      // sometimes the snippet does not appear in the new version. In such case we need
      // to be defensive and prevent possible errors.
      if ((d.location.range.startLine - d.snippet.start) < editor.getDoc().lineCount()) {
        editor.markText(
          {line: d.location.range.startLine - d.snippet.start, ch: 0},
          {line: d.location.range.startLine - d.snippet.start,
           ch: editor.getLine(d.location.range.startLine - d.snippet.start).length},
          {className: "comment-line-styled-background"});
      }
      CodeMirror.autoLoadMode(editor, modeName);
      editor.setSize("100%", "auto");

      _this.editors.push(editor);

      $.each(d.comments, function(j, c) {
        _this.displayCommentData(commentBox, c);
      });
    },

    refreshEditors: function() {
      this.editors.forEach(function(ed) {
        ed.refresh();
      });
    },

    displayCommentData: function(commentBox, comment) {
      var commentInfo = $('<div class="comment-info">');
      var dateTime = $('<span style="color: gray">');
      dateTime.text(new Date(parseInt(comment.timestamp) * 1000).toLocaleString());
      var author = $('<span>');
      var info = '';
      if (comment.author) {
        info += comment.author + ': ';
      }
      if (comment.resolved === undefined) {
        commentBox.addClass("fyi-review");
      } else {
        if (comment.resolved === true) {
          commentBox.addClass("accepted-review");
          info += ' accepted this revision.';
        } else {
          commentBox.addClass("rejected-review");
          info += ' rejected this revision.';
        }
      }
      author.text(info);
      var authorDate = $('<div style="display: table-cell;">');
      authorDate.append(author);
      authorDate.append($('<br>'));
      authorDate.append(dateTime);
      commentInfo.append(authorDate);
      if (comment.description) {
        commentInfo.append(
          $('<div class="comment-pre" style="display: table-cell; width: inherit;">')
          .text(comment.description));
      }
      commentBox.append(commentInfo);
    },

    showReviewScopeThread: function(thread) {
      var _this = this;
      $.each(thread.comments, function(j, c) {
        if (!c) {
          // continue
          return true;
        }
        var commentBox = $('<div class="comment-box">');
        _this.displayCommentData(commentBox, c);
        $('#review-level-comments').append(commentBox);
      });
    },

    showReviewInfo: function() {
      $.post(this.controller + '?action=get_review_info', {},
             function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response != 'error') {
          if (response.length < 1) {
            return;
          }
          var template = Handlebars.compile($("#review-info-hb-template").html());
          $('#review-info-div').html(template(response[0]));
        }
      });
    },

    loadReviews: function() {
      codiad.message.notice('Loading reviews might take up to one minute. Please wait.');
      $('#load-reviews-button').hide();
      $('#review-loading-img').show();
      $('#review-level-comments').empty();
      $('#code-comments').empty();
      $('#review-info-div').empty();
      var _this = this;
      _this.editors = [];
      _this.showReviewInfo();
      // call into controller
      $.post(this.controller + '?action=load_reviews', {},
             function(data) {
        var response = codiad.jsend.parse(data);
        if (response && response != 'error') {
          _this.discussions = _this.groupByPath(response);
          // Find review scope comments.
          $.each(_this.discussions, function(path, discussion) {
            if (!path) {
              $.each(discussion, function(i, thread) {
                _this.showReviewScopeThread(thread);
              });
            }
          });
          $.each(_this.discussions, function(path, discussion) {
            $.each(discussion, function(i, thread) {
              if (thread.snippet) {
                _this.showSnippetThread(thread);
              }
            });
          });
        }
        $('#review-loading-img').hide();
        $('#load-reviews-button').show();
      });
    },

    listBranchesNoError: function(callback) {
      var _this = this;
      $.post(_this.controller + '?action=list_branches', {},
             function(data) {
        var response = $.parseJSON(data);
        if (response && response.status !== 'error') {
          callback(response.data);
        }
      });
    },

    randomString: function(length, chars) {
      var result = '';
      for (var i = length; i > 0; --i) {
        result += chars[Math.round(Math.random() * (chars.length - 1))];
      }
      return result;
    },
  };
})(this, jQuery);
