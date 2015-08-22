<?php

/*
*  Copyright (c) Codiad & Google Inc., distributed
*  as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/

require_once('../../common.php');

class CloudDebugger extends Common {

  private $gapi_prefix = 'https://clouddebugger.googleapis.com/v2/debugger';

  public function SetBreakpoint($debuggee_id, $path, $line, $cond, $exprs) {
    $token = $this->GetAccessToken();

    // Prepare a POST HTTP request.
    $exprs_json = json_encode($exprs);
    $exprs_field = is_array($exprs) ? "'expressions': $exprs_json" : '';
    $postdata = "{'location': {'path': '$path', 'line': '$line'}," .
                "'condition': '$cond', $exprs_field}";
    $opts = array( 'http' => array(
      'method'  => "POST",
      'header'  => "Authorization: Bearer {$token}\r\n" .
                   "Content-Type: application/json\r\n" .
                   "Content-Length: " . strlen($postdata) . "\r\n",
      'content' => $postdata
    ));
    $encoded_id = rawurlencode($debuggee_id);
    $endpoint = "{$this->gapi_prefix}/debuggees/{$encoded_id}/breakpoints/set?debuggeeId={$encoded_id}";

    // Call the API for setting a breakpoint.
    $resp = $this->FileGetContents($endpoint, $opts);
    if ($resp['code'] !== '200') {
      throw new Exception('Cannot set a breakpoint.', $resp['code']);
    } else {
      $breakpoint = json_decode($resp['body'])->breakpoint;
      $breakpoint->debuggeeId = $debuggee_id;
      echo formatJSEND('success', $breakpoint);
    }
  }

  // Retrieves a breakpoint to get a lastest state. '$ignore_error' is mostly useful for the
  // breakpoint polling routine on the browser side, where it is easy to generate many noisy
  // errors that are fine to ignore.
  public function GetBreakpoint($debuggee_id, $breakpoint_id, $ignore_error) {
    $resp = $this->CallGetOrDelete("GET", $debuggee_id, $breakpoint_id);
    if ($resp['code'] !== '200') {
      // For now, '$ignore_error' is always true because 'GetBreakpoint' is used only for polling.
      if ($ignore_error) {
        // Return null to notify the front-end that it is an error in actuality.
        // (The front-end will not call a success callback then.)
        echo formatJSEND('success', null);
      } else {
        throw new Exception('Cannot get a breakpoint.', $resp['code']);
      }
    } else {
      $breakpoint = json_decode($resp['body'])->breakpoint;
      $breakpoint->debuggeeId = $debuggee_id;
      echo formatJSEND('success', $breakpoint);
    }
  }

  // Deletes a breakpoint.
  public function DeleteBreakpoint($debuggee_id, $breakpoint_id) {
    $resp = $this->CallGetOrDelete("DELETE", $debuggee_id, $breakpoint_id);
    if ($resp['code'] !== '200' && $resp['code'] !== '204') {
      throw new Exception('Cannot delete a breakpoint.', $resp['code']);
    } else {
      // The message body is actually ignored.
      echo formatJSEND('success', 'Breakpoint deleted.');
    }
  }

  // Helper function to make an API call to get or delete a breakpoint.
  private function CallGetOrDelete($method, $debuggee_id, $breakpoint_id) {
    $token = $this->GetAccessToken();

    // Prepare a GET HTTP request.
    $opts = array( 'http' => array(
      'method' => $method,
      'header' => "Authorization: Bearer {$token}\r\n"
    ));
    $encoded_did = rawurlencode($debuggee_id);
    $encoded_bid = rawurlencode($breakpoint_id);
    $endpoint = "{$this->gapi_prefix}/debuggees/{$encoded_did}/breakpoints/{$encoded_bid}" .
      "?debuggeeId={$encoded_did}&breakpointId={$encoded_bid}";

    // Call the API for getting a breakpoint.
    return $this->FileGetContents($endpoint, $opts);
  }

  // Returns the id of a matching debuggee for the current Google Cloud project,
  // current Google Cloud Source Repository, and current Git source revision id.
  // Also returns the entire list of debuggees in the Cloud project so that
  // users can manually select a debuggee in the UI at their own risk.
  // In sum, it returns a JSON with two elements:
  //
  // { 'id': <matched debuggee id if found>, 'list': <all debuggees> }
  public function GetDebuggee($repo_name, $revision_id) {
    $token = $this->GetAccessToken();
    $project_num = $this->GetCloudProjectNum();

    // Call API to get a list of all (active) debugees.
    $opts = array( 'http' => array( 'header' => "Authorization: Bearer {$token}\r\n" ));
    $resp = $this->FileGetContents("{$this->gapi_prefix}/debuggees?project={$project_num}", $opts);
    if ($resp['code'] !== '200') {
      throw new Exception('Cannot list debuggees for this Google Cloud project.', $resp['code']);
    }

    $resp_json = json_decode($resp['body']);
    // Debuggees may disappear even if an application is currently deployed,
    // e.g, if an application has gone offline.
    if (empty($resp_json->debuggees) || !is_array($resp_json->debuggees) || count($resp_json->debuggees) === 0) {
      throw new Exception('No debuggee exists in this Google Cloud project.');
    }

    // Try to find a best match with the (numeric) project id, repo name, and revision id.
    foreach ($resp_json->debuggees as $debuggee) {
      // 'sourceContexts' may not always exist.
      if ($debuggee->project === $project_num && !empty($debuggee->sourceContexts)) {
        foreach ($debuggee->sourceContexts as $context) {
          if (!empty($context->cloudRepo->repoId->projectRepoId)) {
            $repo = $context->cloudRepo->repoId->projectRepoId;

            if ($repo->repoName === $repo_name && $context->cloudRepo->revisionId === $revision_id) {
              // Found a perfect match. Return its id. Return the entire debuggee list together
              // anyway so that users may manually select one if they wish to.
              echo formatJSEND('success', array( 'id'   => $debuggee->id,
                                                 'list' => $resp_json->debuggees ));
              return;
            }
          }
        }
      }
    }
    // Did not find a matching debuggee. Return the entire debuggee list anyway.
    echo formatJSEND('success', array( 'list' => $resp_json->debuggees ));
  }
}
?>