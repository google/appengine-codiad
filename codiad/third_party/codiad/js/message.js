(function(global, $){

  var codiad = global.codiad;

  //////////////////////////////////////////////////////////////////////
  // User Alerts / Messages
  //////////////////////////////////////////////////////////////////////
  codiad.message = {
    init: function() {},
    _showMessage: function(toastType, message, options){
      options = options || {};
      options.text = message;
      options.type = toastType;
      options.position = 'top-right';
      $().toastmessage('showToast', options);
    },
    success: function(m, options) {
      options = options || {};
      options.stayTime = 4000 /* milliseconds */;
      this._showMessage('success', m, options);
    },
    error: function(m, options) {
      options = options || {};
      options.stayTime = 10000 /* milliseconds */;
      this._showMessage('error', m, options);
    },
    warning: function(m, options) {
      options = options || {};
      options.stayTime = 7000 /* milliseconds */;
      this._showMessage('warning', m, options);
    },
    notice: function(m, options){
      this._showMessage('notice', m, options);
    },
    hide: function() {
      $(".toast-item-wrapper").remove();
    }
  };

})(this, jQuery);
