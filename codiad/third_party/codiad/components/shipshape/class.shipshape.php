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
    // Truncate the output json file.
    $fp = fopen("/tmp/shipshape-results.json", "w");
    fclose($fp);

    $ret = runShellCommand("shipshape --categories='go vet,JSHint,PyLint'".
                           " --json_output=/tmp/shipshape-results.json".
                           " {$this->escapeShellArg($filepath)}");
    if ($ret->exit_code !=0) {
      // If for any reason shipshape command failed, we don't want to show error message.
      // The reason could be simply that there is no reference at the requested position.
      echo formatJSEND('success', 'Running shipshape failed.');
      return;
    }
    echo formatJSEND('success', json_decode(file_get_contents('/tmp/shipshape-results.json')));
  }
}

?>