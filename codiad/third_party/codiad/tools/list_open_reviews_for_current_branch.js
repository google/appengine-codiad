#!/usr/bin/node

var execSync = require('child_process').execSync;

var repoDir = process.argv[2];

function runGit(command) {
  return execSync('git -C ' + repoDir + ' ' + command).toString('utf8');
}

function runGitOrDie(command) {
  try {
    return execSync('git -C ' + repoDir + ' ' + command).toString('utf8');
  } catch (exitObj) {
    process.exit(1);
  }
}

var BRANCH = runGitOrDie('symbolic-ref HEAD').trim();
var REVIEWS = runGitOrDie('notes --ref refs/notes/devtools/reviews list').trim().split('\n');
var COMMITS = REVIEWS.map(function(v) {
  return v.split(' ')[1];
});

COMMITS.forEach(function(C) {
  var CATFILE_T = "";
  try {
    CATFILE_T = runGit('cat-file -t ' + C + ' 2>/dev/null').trim();
  } catch (exitObj) {
    return;
  }
  if (CATFILE_T === 'commit') {
    var REV_REQ = runGitOrDie("notes --ref refs/notes/devtools/reviews show " +
                              C + " | sort | uniq | sed '/^$/d'").trim().split('\n');
    REV_REQ.forEach(function(Q) {
      var R;
      try {
        R = JSON.parse(Q);
        if (typeof R === 'string') {
          R = JSON.parse(R);
        }
        REV_REF = R.reviewRef;
        if (REV_REF === BRANCH) {
          TARGET_REF = R.targetRef;
          try {
            runGit('merge-base --is-ancestor ' + C + ' ' + TARGET_REF);
          } catch (exitObj) {
            console.log(C);
          }
        }
      } catch (err) {
      }
    });
  }
});
