<?php

/*
*  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
*  as-is and without warranty under the MIT License. See 
*  [root]/license.txt for more. This information must remain intact.
*/

require_once('../../common.php');
require_once('class.filemanager.php');
//////////////////////////////////////////////////////////////////
// Verify Session or Key
//////////////////////////////////////////////////////////////////

checkSession();

?>
<?php

switch($_GET['action']){

    //////////////////////////////////////////////////////////////////
    // Create
    //////////////////////////////////////////////////////////////////
  case 'create':
?>
<form class="codiad-form">
  <input type="hidden" name="path" value="<?php echo($_GET['path']); ?>">
  <input type="hidden" name="type" value="<?php echo($_GET['type']); ?>">
  <label><span class="icon-pencil"></span><?php echo i18n((ucfirst($_GET['type']))); ?></label>
  <input type="text" name="object_name" autofocus="autofocus" autocomplete="off">
  <button class="codiad "><?php i18n("Create"); ?></button>
  <button class="codiad " onclick="codiad.modal.unload(); return false;"><?php i18n("Cancel"); ?></button>
</form>
<?php
    break;

    //////////////////////////////////////////////////////////////////
    // Rename
    //////////////////////////////////////////////////////////////////
  case 'rename':
?>
<form class="codiad-form">
  <input type="hidden" name="path" value="<?php echo($_GET['path']); ?>">
  <input type="hidden" name="type" value="<?php echo($_GET['type']); ?>">
  <label><span class="icon-pencil"></span> <?php i18n("Rename"); ?> <?php echo i18n((ucfirst($_GET['type']))); ?></label>
  <input type="text" name="object_name" autofocus="autofocus" autocomplete="off" value="<?php echo($_GET['short_name']); ?>">
  <button class="codiad "><?php i18n("Rename"); ?></button>
  <button class="codiad " onclick="codiad.modal.unload(); return false;"><?php i18n("Cancel"); ?></button>
</form>
<?php
    break;

    //////////////////////////////////////////////////////////////////
    // Delete
    //////////////////////////////////////////////////////////////////
  case 'delete':
?>
<form class="codiad-form">
  <input type="hidden" name="path" value="<?php echo($_GET['path']); ?>">
  <label><?php i18n("Are you sure you wish to delete the following:"); ?></label>
  <pre class="codiad"><?php if(!FileManager::isAbsPath($_GET['path'])) { echo '/'; }; echo($_GET['path']); ?></pre>
  <button class="codiad "><?php i18n("Delete"); ?></button>
  <button class="codiad " onclick="codiad.modal.unload();return false;"><?php i18n("Cancel"); ?></button>
</form>
<?php
    break;

    //////////////////////////////////////////////////////////////////
    // Preview
    //////////////////////////////////////////////////////////////////
  case 'preview':
?>
<form class="codiad-form">
  <label><?php i18n("Inline Preview"); ?></label>
  <div><br><br><img src="<?php echo(str_replace(BASE_PATH . "/", "", WORKSPACE) . "/" . $_GET['path']); ?>"><br><br></div>
  <button class="codiad " onclick="codiad.modal.unload();return false;"><?php i18n("Close"); ?></button>
</form>
<?php
    break;

    //////////////////////////////////////////////////////////////////
    // Overwrite
    //////////////////////////////////////////////////////////////////
  case 'overwrite':
?>
<form class="codiad-form">
  <input type="hidden" name="path" value="<?php echo($_GET['path']); ?>">
  <label><?php i18n("Would you like to overwrite or duplicate the following:"); ?></label>
  <pre class="codiad"><?php if(!FileManager::isAbsPath($_GET['path'])) { echo '/'; }; echo($_GET['path']); ?></pre>
  <select class="codiad" name="or_action">
    <option value="0"><?php i18n("Overwrite Original"); ?></option>
    <option value="1"><?php i18n("Create Duplicate"); ?></option>
  </select>
  <button class="codiad "><?php i18n("Continue"); ?></button>
  <button class="codiad " onclick="codiad.modal.unload();return false;"><?php i18n("Cancel"); ?></button>
</form>
<?php
    break;

    //////////////////////////////////////////////////////////////////
    // Search
    //////////////////////////////////////////////////////////////////
  case 'search':
?>
<form class="codiad-form">
  <input type="hidden" name="path" value="<?php echo($_GET['path']); ?>">
  <table class="codiad file-search-table">
    <tr>
      <td width="65%">
        <label><?php i18n("Search Files:"); ?></label>
        <input type="text" name="search_string" autofocus="autofocus">
      </td>
      <td width="5%">&nbsp;&nbsp;</td>
      <td>
        <label><?php i18n("In:"); ?></label>
        <select class="codiad" name="search_type">
          <option value="0"><?php i18n("Current Project"); ?></option>
          <?php if(checkAccess()) { ?>
          <option value="1"><?php i18n("Workspace Projects"); ?></option>
          <?php } ?>
        </select>
      </td>
    </tr>
    <tr>
      <td colspan="3">
        <label><?php i18n("File Type:"); ?></label>
        <input type="text" name="search_file_type" placeholder="<?php i18n("space seperated file types eg: js c php"); ?>">
      </td>
    </tr>
  </table>
  <div id="filemanager-search-results"></div>
  <div id="filemanager-search-processing"></div>
  <button class="codiad "><?php i18n("Search"); ?></button>
  <button class="codiad " onclick="codiad.modal.unload();return false;"><?php i18n("Cancel"); ?></button>
</form>
<?php
    break;

    //////////////////////////////////////////////////////////////////
    // Find files
    //////////////////////////////////////////////////////////////////
  case 'findFiles':
?>
<form class="codiad-form">
  <table class="codiad file-search-table">
    <tr>
      <td width="65%">
        <label><?php i18n("Find Files:"); ?></label>
        <input type="text" name="search_string" autofocus="autofocus">
      </td>
    </tr>
  </table>
  <div id="filemanager-search-results"></div>
  <div id="filemanager-search-processing"></div>
  <button class="codiad "><?php i18n("Find"); ?></button>
  <button class="codiad " onclick="codiad.modal.unload();return false;"><?php i18n("Cancel"); ?></button>
</form>
<?php
    break;

  case 'list_all_files':
    $repo = Common::escapeShellArg(Common::GetProjectRoot());
    $ret = runShellCommand("find $repo -type f -not -iwholename '*.git/*' ".
                           " -follow -printf '%P\\n' | sort");
?>
<form>
  <div id="search-file-box">
    <select data-placeholder="Choose a file..." class="chosen-file-select">
      <option value=""></option>
      <?php
    foreach($ret->output as $f) {
      ?><option value="<?php echo $f;?>"><?php echo $f;?></option><?php
    }
      ?>
    </select>
  </div>
</form>
<?php
    break;
}
?>
