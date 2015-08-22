<?php

/*
 *  Copyright (c) Codiad & Andr3as, distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */
require_once('../../common.php');

//////////////////////////////////////////////////////////////////
// Verify Session or Key
//////////////////////////////////////////////////////////////////

checkSession();

if (!isset($_GET['action'])) {
  $_GET['action'] = "settings";
}

switch($_GET['action']) {
  case "settings":
?>
<div class="settings-view">
  <div class="config-menu">
    <label><?php i18n("Settings"); ?></label>
    <div class="panels-components">
      <ul>
        <li name="editor-settings" data-file="components/settings/settings.editor.php" data-name="editor" class="active">
          <a><span class="icon-home bigger-icon"></span>Editor</a>
        </li>
      </ul>
    </div>
    <hr>
  </div>
  <div class="panels">
    <div class="panel active" data-file="components/settings/settings.editor.php">
      <?php include('settings.editor.php'); ?>
    </div>
  </div>
</div>
<button class="codiad" onclick="codiad.modal.unload(); return false;"><?php i18n("Close"); ?></button>
<script>
  $('.settings-view .config-menu li').click(function(){
    codiad.settings._showTab($(this).attr('data-file'));
  });
</script>
<?php
    break;
  case "iframe":
?>
<script>
  /*
       *  Storage Event:
       *  Note: Event fires only if change was made in different window and not in this one
       *  Details: http://dev.w3.org/html5/webstorage/#dom-localstorage
       */
  window.addEventListener('storage', function(e){
    if (/^codiad/.test(e.key)) {
      var obj = { key: e.key, oldValue: e.oldValue, newValue: e.newValue };
      /* Notify listeners */
      window.parent.amplify.publish('settings.changed', obj);
    }
  }, false);
</script>
<?php
    break;
  default:
    break;
}
?>