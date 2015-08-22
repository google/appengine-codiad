<?php
/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

require_once('../../common.php');
require_once('class.kythe.php');

//////////////////////////////////////////////////////////////////
// Verify Session or Key
//////////////////////////////////////////////////////////////////

checkSession();

//////////////////////////////////////////////////////////////////
// Get Action
//////////////////////////////////////////////////////////////////

if(!empty($_GET['action'])){ $action = $_GET['action']; }
else{ exit('{"status":"error","data":{"error":"No Action Specified"}}'); }

//////////////////////////////////////////////////////////////////
// Ensure Project Has Been Loaded
//////////////////////////////////////////////////////////////////

if(!isset($_SESSION['project'])){
  $_GET['action']='get_current';
  $_GET['no_return']='true';
  require_once('../project/controller.php');
}

//////////////////////////////////////////////////////////////////
// Define Root
//////////////////////////////////////////////////////////////////

$_GET['root'] = WORKSPACE;

//////////////////////////////////////////////////////////////////
// Handle Action
//////////////////////////////////////////////////////////////////

$kythe = new Kythe($_GET, $_POST);
$kythe->project = $_SESSION['project'];
$kythe->root = WORKSPACE;

// This call is necessary or otherwise the php calls will be blocked if kythe runs for too long.
session_write_close();

switch($action){
  case 'jump_to_definition': $kythe->JumpToDefinition(); break;
  case 'get_local_refs': $kythe->GetLocalRefs(); break;
  default: exit('{"status":"fail","data":{"error":"Unknown Action"}}');
}
?>
