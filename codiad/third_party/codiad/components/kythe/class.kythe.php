<?php

/*
*  Copyright (c) Codiad & Google Inc., distributed
*  as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/
define("KYTHE_SERVER_PORT", "7777");

require_once('../../common.php');

/*
* This class assumes that there is a kythe server running on port 7777.
* It also assumes that kythe is installed in '/opt/kythe/' directory.
*/
class Kythe extends Common {

  public $root          = "";
  public $project       = "";
  public $get;
  public $post;

  public function __construct($get, $post){
    $this->get = $get;
    $this->post = $post;
  }

  // This function expects the following parameters to be set in GET.
  //   filepath, line, column
  // `line' and `column' are zero-based offsets of the cursor in file.
  public function JumpToDefinition() {
    $filepath = $this->escapeShellArg(str_replace($this->project.'/', '', $this->get['filepath']));
    $repoPath = $this->escapeShellArg("{$this->root}/{$this->project}");
    $dirtyBuffer = $this->escapeShellArg("{$this->root}/{$this->get['filepath']}");
    $line = intval($this->get['line']) + 1;
    $column = intval($this->get['column']);
    $ret = runShellCommand("/opt/kythe/tools/kwazthis -api http://localhost:". KYTHE_SERVER_PORT .
                           " --local_repo=$repoPath".
                           " --dirty_buffer=$dirtyBuffer".
                           " -path $filepath".
                           " -line $line -column $column");
    if ($ret->exit_code !=0 || count($ret->output) == 0) {
      // If for any reason kythe command failed, we don't want to show error message.
      // The reason could be simply that there is no reference at the requested position.
      echo formatJSEND('success');
      return;
    }
    $entries = array_map('json_decode', $ret->output);
    foreach($entries as &$e) {
      if (isset($e->{'node'}->{'definitions'})) {
        echo formatJSEND('success', $e);
        return;
      }
    }
    echo formatJSEND('success');
  }

  public function GetFileTicket($filepath) {
    $ret = runShellCommand("/opt/kythe/tools/kythe --json".
                           " --api http://localhost:". KYTHE_SERVER_PORT.
                           " search --path $filepath /kythe/node/kind file");
    if ($ret->exit_code !=0 || count($ret->output) == 0) {
      return "";
    } else {
      $result = json_decode($ret->output[0]);
      return isset($result->ticket) ? $result->ticket[0] : '';
    }
  }

  // Returns true when the $cursor, which is a byteoffset of the cursor inside the file is between
  // the start and end points of a node(end is exclusive). Returns false otherwise.
  public function LocationMatches($node, $cursor) {
    $startMatches = false;
    $endMatches = false;
    // There are some facts associated with each node in kythe. One of those facts is the location
    // of a node. Location is denoted with a start and end which are byte offset of the node in the
    // file. These byte offsets are base64 encoded.
    foreach ($node->fact as $fact) {
      if ($fact->name === "/kythe/loc/end") {
        if ($cursor < $this->DecodePoint($fact->value)) {
          $endMatches = true;
        }
      }
      if ($fact->name === "/kythe/loc/start") {
        if ($this->DecodePoint($fact->value) <= $cursor) {
          $startMatches = true;
        }
      }
    }
    return $endMatches && $startMatches;
  }

  // Returns the integer value of a kythe's point(start and end).
  public function DecodePoint($point) {
    return intval(base64_decode($point));
  }

  public function GetLocation($node) {
    $location = new stdClass;
    foreach ($node->fact as $fact) {
      if ($fact->name === "/kythe/loc/end") {
        $location->end = $this->DecodePoint($fact->value);
      }
      if ($fact->name === "/kythe/loc/start") {
        $location->start = $this->DecodePoint($fact->value);
      }
    }
    return $location;
  }

  public function GetLocalRefs() {
    $filepath = $this->escapeShellArg(str_replace($this->project.'/', '', $this->get['filepath']));
    $fileTicket = $this->escapeShellArg($this->GetFileTicket($filepath));
    $dirtyBuffer = $this->escapeShellArg("{$this->root}/{$this->get['filepath']}");
    $cursor = $this->get['cursor'];
    $ret = runShellCommand("/opt/kythe/tools/kythe --json".
                           " -api http://localhost:". KYTHE_SERVER_PORT.
                           " refs --dirty $dirtyBuffer $fileTicket");
    if ($ret->exit_code !=0 || count($ret->output) == 0) {
      // If for any reason kythe command failed, we don't want to show error message.
      // The reason could be simply that there is no reference at the requested position.
      echo formatJSEND('success');
      return;
    }
    $kythe_refs = json_decode($ret->output[0]);

    // Go through the kythe's response and build three maps which are addressable by tickets.
    $refs_target = array();
    $refs_source = array();
    $nodes = array();
    $matchedLocationTickets = array();
    foreach ($kythe_refs->reference as $reference) {
      if (!isset($refs_target[$reference->target_ticket])) {
        $refs_target[$reference->target_ticket] = array();
      }
      if (!isset($refs_source[$reference->source_ticket])) {
        $refs_source[$reference->source_ticket] = array();
      }
      $refs_target[$reference->target_ticket][] = $reference;
      $refs_source[$reference->source_ticket][] = $reference;
    }
    foreach ($kythe_refs->node as $node) {
      $nodes[$node->ticket] = $node;
      if ($this->LocationMatches($node, $cursor)) {
        $matchedLocationTickets[] = $refs_source[$node->ticket][0]->target_ticket;
      }
    }

    $ref_locations = array();
    // Go through all the nodes in the file. If the location of the node
    // matches that of the cursor, then use the node's ticket to find all of
    // the references which target ticket is the same as node's ticket.
    // For those references get the location of the nodes whose tickets are
    // the same as the reference's source.
    foreach ($matchedLocationTickets as $t) {
      foreach ($refs_target[$t] as $target_ref) {
        $ref_locations[] = $this->GetLocation($nodes[$target_ref->source_ticket]);
      }
    }
    echo formatJSEND('success', $ref_locations);
  }
}

?>
