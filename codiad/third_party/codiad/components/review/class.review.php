<?php

/*
*  Copyright (c) Codiad & Google Inc., distributed
*  as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/

require_once('../../common.php');

class Review extends Common {

  public $get;
  public $post;

  public function __construct($get, $post){
    $this->get = $get;
    $this->post = $post;
  }

  // Returns the review's json object for the current branch.
  public function GetReviewInfo() {
    Common::RunGitCommand("appraise pull");
    $repo = Common::GetProjectRoot();
    $ret = runShellCommand("list_open_reviews_for_current_branch.js {$this->escapeShellArg($repo)}");
    $review_commit_obj = trim(implode("\n", $ret->output));
    if ($ret->exit_code != 0 || strlen($review_commit_obj) == 0) {
      echo formatJSEND('error', 'No review is available in the current branch.');
      return;
    }
    $ret = Common::RunGitCommand("notes --ref refs/notes/devtools/reviews show $review_commit_obj");
    if ($ret->exit_code == 0) {
      $review_data = array_map('json_decode', $ret->output);
      echo formatJSEND('success', $review_data);
    } else {
      echo formatJSEND('error', implode(" ", $ret->output));
    }
  }

  public function LoadReviews() {
    Common::RunGitCommand("appraise pull");
    $repo = Common::GetProjectRoot();
    $ret = runShellCommand("list_open_reviews_for_current_branch.js {$this->escapeShellArg($repo)}");
    $review_commit_obj = trim(implode("\n", $ret->output));
    if ($ret->exit_code != 0 || strlen($review_commit_obj) == 0) {
      echo formatJSEND('error', 'No review is available in the current branch.');
      return;
    }

    $ret = runShellCommand("list_comments_for_current_branch.js {$this->escapeShellArg($repo)}");
    if ($ret->exit_code !=0 || count($ret->output) == 0) {
      echo formatJSEND('error', 'No comment is available for the current review.');
      return;
    }

    $comments = array_map('json_decode', $ret->output);
    $file_comments = array();
    foreach($comments as &$c) {
      $location_hash = hash('sha1', '', false);
      if (isset($c->{'location'})) {
        $location_hash = hash('sha1', json_encode($c->{'location'}), false);
      }
      if (!isset($file_comments[$location_hash])) {
        $file_comments[$location_hash] = new stdClass;
        if (isset($c->{'location'})) {
          $file_comments[$location_hash]->location = $c->location;
        }
        if (isset($c->{'location'}->{'range'})) {
          $start_line = intval($c->{'location'}->{'range'}->{'startLine'});
          $snippet = new stdClass;
          $snippet->start = max(1, $start_line - 4);
          $snippet->end = $start_line + 4;
          $code = shell_exec('git -C '.$repo.
                             ' show '.$c->{'location'}->{'commit'}.
                             ":'".$c->{'location'}->{'path'}.
                             "' | sed -n '".$snippet->start.",".$snippet->end." p'");
          $snippet->code = $code;
          $file_comments[$location_hash]->snippet = $snippet;
        }
        $file_comments[$location_hash]->comments = array();
      }
      $file_comments[$location_hash]->comments[] = $c;
    }
    echo formatJSEND('success', $file_comments);
  }

  public function GetCurrentBranchName() {
    $ret = Common::RunGitCommand("rev-parse --abbrev-ref HEAD");
    if ($ret->exit_code == 0) {
      return trim(implode("\n", $ret->output));
    } else {
      return NULL;
    }
  }

  public function ListBranches() {
    $repo = Common::GetProjectRoot();
    $ret = runShellCommand("git -C {$this->escapeShellArg($repo)} branch --no-color ".
                           " | awk -F ' +' '! /\(no branch\)/ {print $2}' ");
    if ($ret->exit_code !=0 || count($ret->output) == 0) {
      echo formatJSEND('error', 'No branches in this project.');
      return;
    }
    $branches = $ret->output;
    $currentBranch = $this->GetCurrentBranchName();
    $result = new stdClass;
    $result->current_branch = trim($currentBranch);
    $result->branches = $branches;
    echo formatJSEND('success', $result);
  }
}

?>