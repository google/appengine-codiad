/*
 *  Copyright (c) Codiad, distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){
  $(function() {
    codiad.settings.init();
  });

  codiad.settings = {

    controller: 'components/settings/controller.php',

    init: function() {
      var _this = this;

      /*
          *  Storage Event:
          *  Note: Event fires only if change was made in different window and not in this one
          *  Details: http://dev.w3.org/html5/webstorage/#dom-localstorage
          *
          *  Workaround for Storage-Event:
          */
      $('body').append('<iframe src="components/settings/dialog.php?action=iframe"></iframe>');

      //Load Settings
      this.load();

    },

    setSettings: function() {
      $('.setting').each(function() {
        var setting = $(this).data('setting');
        var val     = $(this).val();
        if (val === null) {
          codiad.message.alert(i18n("You Must Choose A Value"));
          return;
        } else {
          localStorage.setItem(setting, val);
        }
      });
      /* Notify listeners */
      codiad.settings.save();
    },

    //////////////////////////////////////////////////////////////////
    // Save Settings
    //////////////////////////////////////////////////////////////////

    save: function() {
      var key, settings = {};
      var settingsRegex = /^codiad.settings/;


      for (var i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);
        if (settingsRegex.test(key)) {
          settings[key] = localStorage.getItem(key);
        }
      }

      /* Notify listeners */
      amplify.publish('settings.save', settings);

      $.post(this.controller + '?action=save', {settings: JSON.stringify(settings)}, function(data){
        parsed = codiad.jsend.parse(data);
      });
    },

    //////////////////////////////////////////////////////////////////
    // Load Settings
    //////////////////////////////////////////////////////////////////

    load: function() {
      $.get(this.controller + '?action=load', function(data){
        parsed = codiad.jsend.parse(data);
        if (parsed != 'error') {
          $.each(parsed, function(i, item){
            localStorage.setItem(i, item);
          });
          amplify.publish('settings.loaded', parsed);
        }
      });
    },

    //////////////////////////////////////////////////////////////////
    //
    // Show Settings Dialog
    //
    //  Parameter
    //
    //  data_file - {String} - Location of settings file based on BASE_URL
    //
    //////////////////////////////////////////////////////////////////
    show: function(data_file) {
      var _this = this;
      codiad.modal.load(700, 'components/settings/dialog.php?action=settings');
      codiad.modal.hideOverlay();
      codiad.modal.load_process.done(function(){
        if (typeof(data_file) == 'string') {
          codiad.settings._showTab(data_file);
        } else {
          _this._loadTabValues('components/settings/settings.editor.php');
        }
        /* Notify listeners */
        amplify.publish('settings.dialog.show',{});
      });
    },

    //////////////////////////////////////////////////////////////////
    //
    // {Private} Show Specific Tab
    //
    //  Parameter
    //
    //  data_file - {String} - Location of settings file based on BASE_URL
    //
    //////////////////////////////////////////////////////////////////

    _showTab: function(data_file) {
      var _this = this;
      if (typeof(data_file) != 'string') {
        return false;
      }
      $('.settings-view .config-menu .active').removeClass('active');
      $('.settings-view .config-menu li[data-file="' + data_file + '"]').addClass('active');
      $('.settings-view .panels .active').hide().removeClass('active');
      //Load panel
      if ($('.settings-view .panel[data-file="' + data_file + '"]').length === 0) {
        $('.settings-view .panels').append('<div class="panel active" data-file="' + data_file + '"></div>');
        $('.settings-view .panel[data-file="' + data_file + '"]').load(data_file, function(){
          //TODO Show and hide loading information
          /* Notify listeners */
          var name = $('.settings-view .config-menu li[data-file="' + data_file + '"]').attr('data-name');
          amplify.publish('settings.dialog.tab_loaded',name);
          _this._loadTabValues(data_file);
        });
      } else {
        $('.settings-view .panel[data-file="' + data_file + '"]').show().addClass('active');
      }
    },

    //////////////////////////////////////////////////////////////////
    //
    // {Private} Load Settings of Specific Tab
    //
    //  Parameter
    //
    //  data_file - {String} - Location of settings file based on BASE_URL
    //
    //////////////////////////////////////////////////////////////////
    _loadTabValues: function(data_file) {
      //Load settings
      var key, value;
      $('.settings-view .panel[data-file="' + data_file + '"] .setting').each(function(i, item){
        key   = $(item).attr('data-setting');
        value = localStorage.getItem(key);
        if (value !== null) {
          $(item).val(value);
        }
      });
    }
  };
})(this, jQuery);
