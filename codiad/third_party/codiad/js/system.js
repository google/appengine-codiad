/*
 *  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

(function(global, $){

  var codiad = global.codiad = {};

  //////////////////////////////////////////////////////////////////////
  // loadScript instead of getScript (checks and balances and shit...)
  //////////////////////////////////////////////////////////////////////

  $.loadScript = function(url, arg1, arg2) {
    var cache = true,
        callback = null;
    //arg1 and arg2 can be interchangable
    if ($.isFunction(arg1)) {
      callback = arg1;
      cache = arg2 || cache;
    } else {
      cache = arg1 || cache;
      callback = arg2 || callback;
    }

    var load = true;
    //check all existing script tags in the page for the url
    jQuery('script[type="text/javascript"]')
      .each(function() {
      load = (url != $(this).attr('src'));
      return load;
    });
    if (load) {
      //didn't find it in the page, so load it
      jQuery.ajax({
        type: 'GET',
        url: url,
        success: callback,
        dataType: 'script',
        cache: cache
      });
    } else {
      //already loaded so just call the callback
      if (jQuery.isFunction(callback)) {
        callback.call(this);
      }
    }
  };

  //////////////////////////////////////////////////////////////////////
  // Init
  //////////////////////////////////////////////////////////////////////

  $(function() {
    // Console fix for IE
    if (typeof(console) === 'undefined') {
      console = {};
      console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function () {};
    }
    // Messages
    codiad.message.init();

    $('#settings').click(function(){
      codiad.settings.show();
    });
  });

})(this, jQuery);
