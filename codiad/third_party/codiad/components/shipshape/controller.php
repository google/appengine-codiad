<?php
/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

require_once('../../common.php');
require_once('class.shipshape.php');

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
// Handle Action
//////////////////////////////////////////////////////////////////

$shipshape = new Shipshape($_GET, $_POST);
$shipshape->project = $_SESSION['project'];
$shipshape->root = WORKSPACE;

// This is necessary here otherwise the whole execution of server will be blocked.
// See http://konrness.com/php5/how-to-prevent-blocking-php-requests/
session_write_close();

switch($action){
  // Expects 'file_content' in post data
  case 'run': $shipshape->Run(); break;
  default: exit('{"status":"fail","data":{"error":"Unknown Action"}}');
}
?>
