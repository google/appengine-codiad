<?php

/*
*  Copyright (c) Codiad & Google Inc., distributed
*  as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/

require_once('../../common.php');

//////////////////////////////////////////////////////////////////
// Verify Session or Key
//////////////////////////////////////////////////////////////////

checkSession();

switch($_GET['action']){

  //////////////////////////////////////////////////////////////////
  // Set Breakpoint
  //////////////////////////////////////////////////////////////////
  case 'set_breakpoint':
  ?>
  <script>
    // Remove an eval expression row when its delete button is clicked.
    $('#modal-content form').on('click', '.del-expr', function() {
      $(this).closest('tr').remove();
    });

    // Allowing adding eval expression inputs dynamically.
    $('#add-eval-expr').click(function() {
      var template = Handlebars.compile($('#eval-input-template').html());
      $('#add-expr-before-here').before(template);
    });

    function clearEvents() {
      $('#modal-content form').off('click');
      $('#add-eval-expr').off('click');
    }
  </script>

  <script id="eval-input-template" type="text/x-handlebars-template">
  <tr>
    <td colspan="3">
      <input type="text" name="expr"
             placeholder="<?php i18n("expression in the language being debugged"); ?>">
    </td>
    <td width="5%"><span class="del-expr padding-3px-lr">[ - ]</td>
  </tr>
  </script>

  <form class="codiad-form">
    <table class="codiad dbg-dialog-table">
      <tr>
        <td width="75%">
          <label><?php i18n("Breakpoint in File:"); ?></label>
          <input type="text" value="<?php echo($_GET['path']); ?>" readonly="readonly">
        </td>
        <td width="5%">&nbsp;&nbsp;</td>
        <td colspan="2">
          <label><?php i18n("Line:"); ?></label>
          <input type="text" value="<?php echo($_GET['line']); ?>" readonly="readonly">
        </td>
      </tr>
      <tr>
        <td colspan="4">
          <label><?php i18n("Breakpoint Condition:"); ?></label>
          <input type="text" name="cond" autofocus="autofocus"
                 placeholder="<?php i18n("expression in the language being debugged"); ?>">
        </td>
      </tr>
      <tr>
        <td colspan="3">
          <label><?php i18n("Optional expressions to evaluate:"); ?></label>
          <input type="text" name="expr"
                 placeholder="<?php i18n("expression in the language being debugged"); ?>">
        </td>
        <td width="5%">&nbsp;&nbsp;</td>
      </tr>
      <tr id="add-expr-before-here">
        <td colspan="4"><span id="add-eval-expr">[ + Add more expressions ]</span></td>
      </tr>
    </table>
    <button class="codiad " onclick="clearEvents();"><?php i18n("Set"); ?></button>
    <button class="codiad " onclick="codiad.modal.unload();clearEvents();return false;"><?php i18n("Cancel"); ?></button>
  </form>
  <?php
  break;

  //////////////////////////////////////////////////////////////////
  // Enable Debug Mode
  //////////////////////////////////////////////////////////////////
  case 'debug_mode':
    $project_id = $repo_name = $revision_id = '';

    try {
      $project_id = Common::GetCloudProjectId();
      $repo_name = Common::GetCloudRepoName();
      $revision_id = Common::GetGitRevisionId();
    } catch (Exception $e) { }
  ?>

  <script>
    // Enable the submit button only when a debuggee is explicitly selected.
    $('#modal-content select[name="which_debuggee"]').on('change', function() {
      var disable = this.value === 'disable_submit';
      $('#modal-content button[name="submit"]').prop('disabled', disable);
    });

    function clearEvents() {
      $('#modal-content select[name="which_debuggee"]').off('change');
    }
  </script>

  <form class="codiad-form">
    <label><?php i18n("Enable debug mode with:"); ?></label>
    <select class="codiad" name="which_debugger">
      <option value="cloud_debugger">Google Cloud Debugger(beta)</option>
    </select>
    <div class="padding-3px bold">Google Cloud Debugger(beta)</div>
    <div class="padding-3px">You should have enabled <b>Cloud Debugger API</b> for this project.</div>
    <div class="padding-3px">The Cloud Debugger is a feature of the Google Cloud Platform that lets you inspect the state of a Java application at any code location without stopping or slowing it down. The debugger makes it easier to view the application state without adding logging statements.</div>

    <div>&nbsp;</div>
    <div class="padding-3px bold">Current Source Revision Information:</div>
    <table class="dbg-watch-exprs padding-3px">
      <tr><td class="shrink">Google Cloud Project</td><td class="expand"><?php echo(empty($project_id) ? 'Unable to retrieve project name' : $project_id); ?></td></tr>
      <tr><td>Repository Name</td><td><?php echo(empty($repo_name) ? 'Unable to retrieve repository name' : ($repo_name === 'default' ? $project_id : $repo_name)); ?></td></tr>
      <tr><td>Revision ID</td><td><?php echo(empty($revision_id) ? 'Unable to retrieve revision ID' : $revision_id); ?></td></tr>
    </table>

    <div>&nbsp;</div>
    <div class="padding-3px bold">Selected Target Application:</div>
    <select class="codiad" name="which_debuggee">
      <option value="disable_submit">Please wait while locating a deployed application...</option>
    </select>

    <input type="hidden" name="repo_name" value="<?php echo($repo_name); ?>">
    <input type="hidden" name="revision_id" value="<?php echo($revision_id); ?>">

    <button class="codiad " name="submit" onclick="clearEvents();" disabled="disabled"><?php i18n("Enable"); ?></button>
	<button class="codiad " onclick="codiad.modal.unload();clearEvents();return false;"><?php i18n("Cancel"); ?></button>
    <span class="padding-3px">Files will become read-only in the debug mode.</span>
  </form>
  <?php
  break;
}
?>
