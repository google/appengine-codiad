/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){

  var codiad = global.codiad;

  $(function() {
    codiad.project.init();
  });

  codiad.project = {

    controller: 'components/project/controller.php',
    dialog: 'components/project/dialog.php',

    init: function() {
      this.loadCurrent();
      this.loadSide();

      var _this = this;

      $('#projects-create').click(function(){
        codiad.project.create('true');
      });

      $('#projects-manage').click(function(){
        codiad.project.list();
      });

      $('#projects-collapse').click(function(){
        if (!_this._sideExpanded) {
          _this.projectsExpand();
        } else {
          _this.projectsCollapse();
        }
      });
    },

    //////////////////////////////////////////////////////////////////
    // Get Current Project
    //////////////////////////////////////////////////////////////////

    loadCurrent: function() {
      $.get(this.controller + '?action=get_current', function(data) {
        var projectInfo = codiad.jsend.parse(data);
        if (projectInfo != 'error') {
          $('#file-manager')
            .html('')
            .append('<ul><li><a id="project-root" data-type="root" class="directory" data-path="' + projectInfo.path + '">' + projectInfo.name + '</a></li></ul>');
          codiad.filemanager.index(projectInfo.path);
          codiad.user.project(projectInfo.path);
          codiad.message.success(i18n('Project %{projectName}% Loaded', {projectName:projectInfo.name}));
        }
      });
    },

    //////////////////////////////////////////////////////////////////
    // Open Project
    //////////////////////////////////////////////////////////////////

    open: function(path) {
      var _this = this;
      $.get(this.controller + '?action=open&path=' + path, function(data) {
        var projectInfo = codiad.jsend.parse(data);
        if (projectInfo != 'error') {
          _this.loadCurrent();
          codiad.modal.unload();
          codiad.user.project(path);
          localStorage.removeItem("lastSearched");
          /* Notify listeners. */
          amplify.publish('project.onOpen', path);
        }
      });
    },

    //////////////////////////////////////////////////////////////////
    // Open the project manager dialog
    //////////////////////////////////////////////////////////////////

    list: function() {
      $(document).off('submit', '#modal-content form'); // Prevent form bubbling
      codiad.modal.load(500, this.dialog + '?action=list');
    },

    //////////////////////////////////////////////////////////////////
    // Load and list projects in the sidebar.
    //////////////////////////////////////////////////////////////////
    loadSide: function() {
      $('.sb-projects-content').load(this.dialog + '?action=sidelist&trigger=true');
      this._sideExpanded = true;
    },

    projectsExpand: function() {
      this._sideExpanded = true;
      $('#side-projects').css('height', 276+'px');
      $('.project-list-title').css('right', 0);
      $('#projects-collapse')
        .removeClass('icon-up-dir')
        .addClass('icon-down-dir');
    },

    projectsCollapse: function() {
      this._sideExpanded = false;
      $('#side-projects').css('height', 33+'px');
      $('.project-list-title').css('right', 0);
      $('#projects-collapse')
        .removeClass('icon-down-dir')
        .addClass('icon-up-dir');
    },

    //////////////////////////////////////////////////////////////////
    // Create Project
    //////////////////////////////////////////////////////////////////

    create: function(close, fromGitRepo, gitRepoName) {
      var _this = this;
      create = true;
      codiad.modal.load(500, this.dialog + '?action=create&close=' + close +
                        (fromGitRepo !== undefined ? '&from_git_repo=' + fromGitRepo : '') +
                        (gitRepoName !== undefined ? '&git_repo_name=' + gitRepoName : ''));
      $(document).off('submit').on('submit', '#modal-content form', function(e) {
        e.preventDefault();
        var projectName = $('#modal-content form input[name="project_name"]').val().trim(),
            projectPath = $('#modal-content form input[name="project_path"]').val().trim(),
            gitRepo = $('#modal-content form input[name="git_repo"]').val().trim(),
            gitBranch = $('#modal-content form input[name="git_branch"]').val().trim();
        if(projectPath.indexOf('/') === 0) {
          alert("Project path cannot be absolute.");
        } else {
          $('#modal-content form button').hide();
          $('#modal-content form #loading-img').show();
          $.get(_this.controller + '?action=create&project_name=' + projectName +
                '&project_path=' + projectPath + '&git_repo=' + gitRepo + '&git_branch=' + gitBranch,
                function(data) {
            createResponse = codiad.jsend.parse(data);
            if (createResponse != 'error') {
              _this.open(createResponse.path);
              codiad.modal.unload();
              _this.loadSide();
              /* Notify listeners. */
              amplify.publish('project.onCreate', {"name": projectName, "path": projectPath, "git_repo": gitRepo, "git_branch": gitBranch});
            } else {
              $('#modal-content form button').show();
              $('#modal-content form #loading-img').hide();
            }
          });
        }
      });
    },

    listCloudRepos: function() {
      codiad.modal.load(350, this.dialog + '?action=list_cloud_repos');
    },

    //////////////////////////////////////////////////////////////////
    // Rename Project
    //////////////////////////////////////////////////////////////////

    rename: function(path,name) {
      var _this = this;
      codiad.modal.load(500, this.dialog + '?action=rename&path=' + escape(path) + '&name='+name);
      $(document).off('submit').on('submit', '#modal-content form', function(e) {
        e.preventDefault();
        var projectPath = $('#modal-content form input[name="project_path"]').val();
        var projectName = $('#modal-content form input[name="project_name"]').val();
        $.get(_this.controller + '?action=rename&project_path=' + projectPath + '&project_name=' + projectName, function(data) {
          renameResponse = codiad.jsend.parse(data);
          if (renameResponse != 'error') {
            codiad.message.success(i18n('Project renamed'));
            _this.loadSide();
            $('#file-manager a[data-type="root"]').html(projectName);
            codiad.modal.unload();
            /* Notify listeners. */
            amplify.publish('project.onRename', {"path": projectPath, "name": projectName});
          }
        });
      });
    },

    //////////////////////////////////////////////////////////////////
    // Delete Project
    //////////////////////////////////////////////////////////////////

    delete: function(name, path) {
      var _this = this;
      codiad.modal.load(500, this.dialog + '?action=delete&name=' + escape(name) + '&path=' + escape(path));
      $(document).off('submit').on('submit', '#modal-content form', function(e) {
        e.preventDefault();
        var projectPath = $('#modal-content form input[name="project_path"]')
        .val();
        var deletefiles = $('input:checkbox[name="delete"]:checked').val();
        var followlinks = $('input:checkbox[name="follow"]:checked').val();
        var action = '?action=delete';
        if( typeof deletefiles !== 'undefined' ) {
          if( typeof followlinks !== 'undefined' ) {
            action += '&follow=true&path=' + projectPath;
          } else {
            action += '&path=' + projectPath;
          }
        }
        $.get(codiad.filemanager.controller + action, function(d) {
          $.get(_this.controller + '?action=delete&project_path=' + projectPath, function(data) {
            deleteResponse = codiad.jsend.parse(data);
            if (deleteResponse != 'error') {
              codiad.message.success(i18n('Project Deleted'));
              _this.list();
              _this.loadSide();
              // Remove any active files that may be open
              for(var path in codiad.active.buffers) {
                var b = codiad.active.buffers[path];
                if (path.indexOf(projectPath) === 0) {
                  codiad.active.remove(path);
                }
              }
              /* Notify listeners. */
              amplify.publish('project.onDelete', {"path": projectPath, "name": name});
            }
          });
        });
      });
    },

    //////////////////////////////////////////////////////////////////
    // Check Absolute Path
    //////////////////////////////////////////////////////////////////

    isAbsPath: function(path) {
      if ( path.indexOf("/") === 0 ) {
        return true;
      } else {
        return false;
      }
    },

    //////////////////////////////////////////////////////////////////
    // Get Current (Path)
    //////////////////////////////////////////////////////////////////

    getCurrent: function() {
      var _this = this;
      var currentResponse = null;
      $.ajax({
        url: _this.controller + '?action=current',
        async: false,
        success: function(data) {
          currentResponse = codiad.jsend.parse(data);
        }
      });
      return currentResponse;
    }
  };
})(this, jQuery);
