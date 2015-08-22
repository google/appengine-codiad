(function(global, $){

  var codiad = global.codiad;

  //////////////////////////////////////////////////////////////////////
  // Modal
  //////////////////////////////////////////////////////////////////////

  codiad.modal = {

    load: function(width, url, data) {
      data = data || {};
      $('#modal').css({'min-width': width + 'px'});

      $('#modal-content')
        .html('<div id="modal-loading"></div>');
      this.load_process = $.get(url, data, function(data) {
        try {
          var response = $.parseJSON(data);
          if (response.status && response.status === 'error') {
            $('#modal-content').html(
              '<div class="dialog-error">' + response.message + '</div>'
            );
            return;
          }
        } catch(err) {
        }
        $('#modal-content').html(data);
        // Fix for Firefox autofocus goofiness
        $('input[autofocus="autofocus"]').focus();
      });
      $('#modal, #modal-overlay').fadeIn(200);
    },

    hideOverlay: function() {
      $('#modal-overlay').hide();
    },

    unload: function() {
      $('#modal-content form').off('submit'); // Prevent form bubbling
      $('#modal, #modal-overlay').fadeOut(200);
      $('#modal-content').html('');
      if (codiad.active.activeBuffer) {
        codiad.active.editor.focus();
      }
    },
  };

})(this, jQuery);
