#!/usr/bin/node

var execSync = require('child_process').execSync;

var repoDir = process.argv[2];

function runGit(command) {
  return execSync('git -C ' + repoDir + ' ' + command).toString('utf8');
}

var REVIEWS = execSync('list_open_reviews_for_current_branch.js ' +
                       repoDir).toString('utf8').trim().split('\n');
REVIEWS.forEach(function(R) {
  try {
    // Run the command once to make sure there is no error. If there is, report them.
    runGit('notes --ref refs/notes/devtools/discuss show ' + R + ' 2>&1');

    var D = runGit('notes --ref refs/notes/devtools/discuss show ' +
                   R + ' 2> /dev/null 2>&1 | sort | uniq | sed "/^$/d"').trim().split('\n');
    if (D) {
      D.forEach(function(line) {
        if (line.trim()) {
          console.log(line);
        }
      });
    }
  } catch (exitObj) {
    // Outputing the stdout which contains errors.
    // "'' +" is necessary because the stdout is not encoded utf8 by default.
    console.log('' + exitObj.stdout);
    process.exit(1);
  }
});
