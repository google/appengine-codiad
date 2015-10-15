<?php

/*
*  Copyright (c) Codiad & Google Inc., distributed
*  as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/

require_once('../../common.php');

// This class is responsible for providing the linter functionality
// for different languages using shipshape.
class Shipshape extends Common {

  public $root          = "";
  public $project       = "";
  public $get;
  public $post;

  public function __construct($get, $post){
    $this->get = $get;
    $this->post = $post;
  }

  public function Run() {
    $filepath = "{$this->root}/{$this->get['filepath']}";
    $tmpfname = tempnam("/tmp", "shipshape-results-");
    $fp = fopen($tmpfname, "w");
    fclose($fp);

    $ret = runShellCommand("shipshape --categories='go vet,JSHint,PyLint' --json_output=$tmpfname".
                           " {$this->escapeShellArg($filepath)}");
    echo formatJSEND('success', json_decode(file_get_contents($tmpfname)));
    unlink($tmpfname);
  }
}

?>