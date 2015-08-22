<?php
/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

require_once('../../common.php');
require_once('class.debugger.php');

//////////////////////////////////////////////////////////////////
// Verify Session or Key
//////////////////////////////////////////////////////////////////

checkSession();

//////////////////////////////////////////////////////////////////
// Get Action
//////////////////////////////////////////////////////////////////

if(!empty($_GET['action'])){ $action = $_GET['action']; }
else if(!empty($_POST['action'])){ $action = $_POST['action']; }
else{ exit('{"status":"error","message":"No Action Specified"}'); }

//////////////////////////////////////////////////////////////////
// Ensure Project Has Been Loaded
//////////////////////////////////////////////////////////////////

if(!isset($_SESSION['project'])){
  $_GET['action']='get_current';
  $_GET['no_return']='true';
  require_once('../project/controller.php');
}

// Release a lock on '$_SESSION'. No one writes to it.
session_write_close();

//////////////////////////////////////////////////////////////////
// Handle Action
//////////////////////////////////////////////////////////////////

$debugger = new CloudDebugger();

try{
  switch($action){
    case 'get_debuggee':
      $debugger->GetDebuggee($_GET['repo_name'], $_GET['revision_id']);
      break;

    case 'set_breakpoint':
      $debugger->SetBreakpoint($_POST['debuggee_id'], $_POST['path'], $_POST['line'],
                               $_POST['cond'], $_POST['exprs']);
      break;

    case 'get_breakpoint':
      $debugger->GetBreakpoint($_GET['did'], $_GET['bid'], $_GET['ignore_err']);
      break;

    case 'delete_breakpoint':
      $debugger->DeleteBreakpoint($_GET['did'], $_GET['bid']);
      break;

    default:
      exit('{"status":"error","message":"Unknown Action"}');
  }
}catch(Exception $e){
  // If a response code is set, print it too.
  $code = empty($e->getCode()) ? '' : " [code: {$e->getCode()}]";
  echo formatJSEND('error', $e->getMessage() . $code);
}
?>
