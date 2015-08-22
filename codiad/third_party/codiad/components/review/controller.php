<?php
/*
 *  Copyright (c) Codiad & Google Inc., distributed
 *  as-is and without warranty under the MIT License. See
 *  [root]/license.txt for more. This information must remain intact.
 */

require_once('../../common.php');
require_once('class.review.php');

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

$review = new Review($_GET, $_POST);

// This call is necessary or otherwise the php calls will be blocked if git commands runs for too
// long.
session_write_close();

switch($action){
  case 'load_reviews': $review->LoadReviews(); break;
  case 'list_branches': $review->ListBranches(); break;
  case 'get_review_info': $review->GetReviewInfo(); break;
  default: exit('{"status":"fail","data":{"error":"Unknown Action"}}');
}
?>
