<?php
require_once('common.php');

// Context Menu
$context_menu = file_get_contents(COMPONENTS . "/filemanager/context_menu.json");
$context_menu = json_decode($context_menu,true);

// Read Components, Plugins, Themes
$components = Common::readDirectory(COMPONENTS);
$plugins = Common::readDirectory(PLUGINS);
$themes = Common::readDirectory(THEMES);

// Theme
$theme = THEME;
if(isset($_SESSION['theme'])) {
  $theme = $_SESSION['theme'];
}
?>
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Codiad</title>
    <?php
// Load System CSS Files
$stylesheets = array("jquery.toastmessage.css","reset.css","fonts.css","screen.css");
foreach($stylesheets as $sheet){
  if(file_exists(THEMES . "/". $theme . "/".$sheet)){
    echo('<link rel="stylesheet" href="themes/'.$theme.'/'.$sheet.'">');
  } else {
    echo('<link rel="stylesheet" href="themes/default/'.$sheet.'">');
  }
}
// Load Component CSS Files
foreach($components as $component){
  if(file_exists(THEMES . "/". $theme . "/" . $component . "/screen.css")){
    echo('<link rel="stylesheet" href="themes/'.$theme.'/'.$component.'/screen.css">');
  } else {
    if(file_exists("themes/default/" . $component . "/screen.css")){
      echo('<link rel="stylesheet" href="themes/default/'.$component.'/screen.css">');
    } else {
      if(file_exists(COMPONENTS . "/" . $component . "/screen.css")){
        echo('<link rel="stylesheet" href="components/'.$component.'/screen.css">');
      }
    }
  }
}
// Load Plugin CSS Files
foreach($plugins as $plugin){
  if(file_exists(THEMES . "/". $theme . "/" . $plugin . "/screen.css")){
    echo('<link rel="stylesheet" href="themes/'.$theme.'/'.$plugin.'/screen.css">');
  } else {
    if(file_exists("themes/default/" . $plugin . "/screen.css")){
      echo('<link rel="stylesheet" href="themes/default/'.$plugin.'/screen.css">');
    } else {
      if(file_exists(PLUGINS . "/" . $plugin . "/screen.css")){
        echo('<link rel="stylesheet" href="plugins/'.$plugin.'/screen.css">');
      }
    }
  }
}
    ?>
    <link rel="icon" href="favicon.ico" type="image/x-icon" />
    <link href="js/jquery-ui-1.11.4/themes/smoothness/jquery-ui.min.css" rel="stylesheet" />
    <link href="js/jquery-ui-1.11.4/themes/smoothness/theme.css" rel="stylesheet" />
    <link href="js/jquery-layout/layout-default.css" rel="stylesheet" />
    <link href="js/chosen/chosen.css" rel="stylesheet" />

    <link href="js/codemirror/lib/codemirror.min.css" rel="stylesheet" />
    <link href="js/codemirror/addon/hint/show-hint.min.css" rel="stylesheet" />
    <link href="js/codemirror/addon/lint/lint.min.css" rel="stylesheet" />
    <link href="js/codemirror/addon/fold/foldgutter.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/abcdef.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/midnight.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/lesser-dark.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/mdn-like.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/pastel-on-dark.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/paraiso-dark.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/ambiance.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/rubyblue.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/cobalt.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/erlang-dark.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/base16-dark.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/3024-night.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/base16-light.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/twilight.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/tomorrow-night-bright.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/ambiance-mobile.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/xq-dark.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/paraiso-light.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/vibrant-ink.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/tomorrow-night-eighties.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/mbo.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/zenburn.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/xq-light.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/monokai.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/elegant.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/solarized.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/blackboard.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/colorforth.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/the-matrix.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/eclipse.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/neat.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/3024-day.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/neo.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/night.min.css" rel="stylesheet" />
    <link href="js/codemirror/theme/ttcn.min.css" rel="stylesheet" />
    <link href="js/codemirror/addon/dialog/dialog.min.css" rel="stylesheet">
    <link href="js/codemirror/addon/search/matchesonscrollbar.min.css" rel="stylesheet">
    <link href="themes/default/codemirror.css" rel="stylesheet">
    <style>
      .ui-layout-north {
        border: 0px;
        padding: 0px;
        margin: 0px;
        background-color: #474747;
        overflow: visible;
        z-index: 100001;
      }
    </style>

    <script src="js/jquery-2.1.3.min.js"></script>
    <script src="js/jquery-migrate-1.2.1.min.js"></script>
    <script src="js/jquery-ui-1.11.4/jquery-ui.min.js"></script>
    <script src="js/jquery.easing.js"></script>
    <script src="js/jquery.toastmessage.js"></script>
    <script src="js/amplify.min.js"></script>
    <script src="js/localstorage.js"></script>
    <script src="js/jquery.hoverIntent.min.js"></script>
    <script src="js/system.js"></script>
    <script src="js/modal.js"></script>
    <script src="js/message.js"></script>
    <script src="js/jsend.js"></script>
    <script src="js/jquery-layout/jquery.layout.min.js"></script>
    <script src="js/handlebars.min.js"></script>
    <script src="js/chosen/chosen.jquery.min.js"></script>

    <!-- Terminal -->
    <script src="js/socket.io-1.3.5.js"></script>
    <script src="shell/term.min.js"></script>

    <!-- CodeMirror -->
    <script src="js/csslint.min.js"></script>

    <script src="js/codemirror/lib/codemirror.min.js"></script>
    <script src="js/codemirror/addon/selection/active-line.min.js"></script>
    <script src="js/codemirror/addon/edit/closebrackets.min.js"></script>
    <script src="js/codemirror/addon/edit/matchbrackets.min.js"></script>
    <script src="js/codemirror/addon/edit/closetag.min.js"></script>
    <script src="js/codemirror/addon/edit/trailingspace.min.js"></script>
    <script src="js/codemirror/addon/hint/show-hint.min.js"></script>
    <script src="js/codemirror/addon/hint/anyword-hint.min.js"></script>
    <script src="js/codemirror/addon/lint/lint.min.js"></script>
    <script src="js/codemirror/addon/lint/json-lint.min.js"></script>
    <script src="js/codemirror/addon/lint/css-lint.min.js"></script>
    <script src="js/codemirror/addon/fold/foldcode.min.js"></script>
    <script src="js/codemirror/addon/fold/foldgutter.min.js"></script>
    <script src="js/codemirror/addon/fold/brace-fold.min.js"></script>
    <script src="js/codemirror/addon/fold/xml-fold.min.js"></script>
    <script src="js/codemirror/addon/fold/markdown-fold.min.js"></script>
    <script src="js/codemirror/addon/fold/comment-fold.min.js"></script>
    <script src="js/codemirror/addon/display/autorefresh.min.js"></script>
    <script src="js/codemirror/addon/display/rulers.min.js"></script>

    <script src="js/codemirror/addon/comment/comment.min.js"></script>
    <script src="js/codemirror/addon/dialog/dialog.min.js"></script>
    <script src="js/codemirror/addon/search/searchcursor.min.js"></script>
    <script src="js/codemirror/addon/search/search.min.js"></script>
    <script src="js/codemirror/addon/search/match-highlighter.min.js"></script>
    <script src="js/codemirror/addon/search/matchesonscrollbar.min.js"></script>
    <script src="js/codemirror/addon/scroll/annotatescrollbar.min.js"></script>
    <script src="js/codemirror/addon/mode/loadmode.min.js"></script>
    <script src="js/codemirror/addon/mode/simple.min.js"></script>
    <script src="js/codemirror/addon/mode/overlay.min.js"></script>
    <script src="js/codemirror/addon/mode/multiplex.min.js"></script>
    <script src="js/codemirror/mode/meta.min.js"></script>
    <script src="js/codemirror/mode/javascript/javascript.min.js"></script>
    <script src="js/codemirror/mode/css/css.min.js"></script>
    <script src="js/codemirror/mode/xml/xml.min.js"></script>
    <script src="js/codemirror/mode/htmlmixed/htmlmixed.min.js"></script>

    <script src="js/instance.js?v=<?php echo time(); ?>"></script>
    <script>
      var i18n = (function(lang) {
        return function(word,args) {
          var x;
          var returnw = (word in lang) ? lang[word] : word;
          for(x in args){
            returnw=returnw.replace("%{"+x+"}%",args[x]);
          }
          return returnw;
        }
      })(<?php echo json_encode($lang); ?>)
    </script>
    <!-- JSBeautify -->
    <script src="js/beautify.js"></script>
    <script src="js/beautify-css.js"></script>
    <!-- html must come last -->
    <script src="js/beautify-html.js"></script>
    <?php include 'components/layout/templates.php' ?>
    <script id="cm-tab-visible-css-hb-template" type="text/x-handlebars-template">
      <style type="text/css" id="cm-visible-tab-css">
        .cm-tab {
          background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAMCAYAAAAkuj5RAAAABGdBTUEAALGPC/xhBQAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB98IBxIGK2dfXvoAAAB/SURBVEgNY2AYBaMhMPxD4H3rHmYgdgRiAZBvgbQ3zNdMMMZgpgWrXf4C3fcQiO2BjhcE0iww97IABdxhnCFAMwPdaA/EIBoMWIC+2wnjDGYaGNByQPeZAPEjIJaFuXVIJCGg40EhrgVyPDDAz8EcP+RooEcYh5yjRx082EMAACk0HXKOaoOfAAAAAElFTkSuQmCC);
          background-position: right;
          background-repeat: no-repeat;
        }
      </style>
    </script>
  </head>
  <body>
    <div id="message"></div>
    <div id="context-menu" data-path="" data-type="">

      <?php
////////////////////////////////////////////////////////////
// Load Context Menu
////////////////////////////////////////////////////////////
foreach($context_menu as $menu_item=>$data){
  if($data['title']=='Break'){
    echo('<hr class="'.$data['applies-to'].'">');
  } else{
    echo('<a class="'.$data['applies-to'].'" onclick="'.
         $data['onclick'].'"><span class="'.$data['icon'].'"></span>'.
         get_i18n($data['title']).'</a>');
  }
}

foreach ($plugins as $plugin){
  if(file_exists(PLUGINS . "/" . $plugin . "/plugin.json")) {
    $pdata = file_get_contents(PLUGINS . "/" . $plugin . "/plugin.json");
    $pdata = json_decode($pdata,true);
    if(isset($pdata[0]['contextmenu'])) {
      foreach($pdata[0]['contextmenu'] as $contextmenu) {
        if((!isset($contextmenu['admin']) || ($contextmenu['admin'])
            && checkAccess()) || !$contextmenu['admin']){
          if(isset($contextmenu['applies-to']) 
             && isset($contextmenu['action']) && isset($contextmenu['icon'])
             && isset($contextmenu['title'])) {
            echo('<hr class="'.$contextmenu['applies-to'].'">');
            echo('<a class="'.$contextmenu['applies-to'].'" onclick="'.
                 $contextmenu['action'].'"><span class="'.
                 $contextmenu['icon'].'"></span>'.$contextmenu['title'].'</a>');
          }
        }
      }
    }
  }
}

      ?>

    </div>
    <?php

//////////////////////////////////////////////////////////////////
// NOT LOGGED IN
//////////////////////////////////////////////////////////////////
if(!isset($_SESSION['user'])){
  $path = rtrim(str_replace("index.php", "", $_SERVER['SCRIPT_FILENAME']),"/");

  $config = file_exists($path . "/config.php");
  $users = file_exists($path . "/data/users.php");
  $projects = file_exists($path . "/data/projects.php");
  $active = file_exists($path . "/data/active.php");

  if (!$config || !$users || !$projects || !$active) {
    // Installer
    require_once('components/install/view.php');
  } else {
    // Login form
    ?>

    <script src="components/user/init.js"></script>
    <script>
      codiad.user.authenticate();
    </script>

    <?php
  }
  //////////////////////////////////////////////////////////////////
  // AUTHENTICATED
  //////////////////////////////////////////////////////////////////
} else {
    ?>
    <div class="ui-layout-north">
      <?php include 'components/menu/index.php'?>
    </div>
    <div class="ui-layout-west">
      <div id="sb-left">
        <div title="Current Git Branch" class="file-manager-branch-div">
          <div class="branch-image" style="min-width: 25px; float:left; margin-top: 4px;"></div>
          <div style="width: 100%; vertical-align: top;">
            <input name="file-manager-branch-text" readonly value="">
          </div>
        </div>
        <div class="sb-left-content">
          <div id="file-manager"></div>
        </div>
        <div class="bottom-bar">
        </div>
      </div>
    </div>
    <div class="ui-layout-center">
      <div id="editor-top-bar">
        <ul id="tab-list-active-files"> </ul>
        <div id="tab-dropdown">
          <a id="tab-dropdown-button" class="icon-down-open"></a>
        </div>
        <div id="tab-close">
          <a id="tab-close-button" class="icon-cancel-circled"
             title="<?php i18n("Close All") ?>"></a>
        </div>
      </div>
      <ul id="dropdown-list-active-files"></ul>
      <div id="editor-region">
        <div id="root-editor-wrapper" class="editor"></div>
      </div>
      <div class="bottom-bar" id="editor-bottom-bar">
        <div id="search-files" onclick="codiad.filemanager.autoCompleteFiles();"></div>
        <div class="divider"></div>
        <div id="search-file-box" style="display: none;">
          <form style="width: inherit; display: inline-block;">
            <select data-placeholder="Choose a file..." class="chosen-file-select"
                    style="width: 100%;
                           border-radius: 2px;
                           height: 1.55em;
                           margin-top: -2px;
                           -webkit-appearance: none;
                           -moz-appearance: none;
                           background-color: transparent;
                           color: white;" tabindex="2">
              <option value=""></option>
              <option value="dind/Makefile">dind/Makefile</option>
              <option value="dind/gce-sources.list">dind/gce-sources.list</option>
              <option value="dind/onrun.sh">dind/onrun.sh</option>
              <option value="AUTHORS">AUTHORS</option>
              <option value="codiad/Dockerfile">codiad/Dockerfile</option>
              <option value="codiad/third_party/codiad/js/codemirror/bin/lint">codiad/third_party/codiad/js/codemirror/bin/lint</option>
            </select>
          </form>
        </div>
        <div id="current-file"></div>
        <div style="float: right">
          <div class="divider"></div>
          <div id="cursor-position"></div>
          <div class="divider"></div>
          <div id="settings-icon" onclick="codiad.settings.show();"></div>
        </div>
      </div>
    </div>
    <div class="ui-layout-east">
      <?php include 'components/review/index.php' ?>
      <?php include 'components/debugger/index.php' ?>
    </div>
    <div class="ui-layout-south">
      <?php include 'components/terminal/index.php' ?>
      <?php include 'components/kythe/index.php' ?>
    </div>
    <div id="modal-overlay"></div>
    <div id="modal">
      <div id="close-handle" class="icon-cancel" onclick="codiad.modal.unload();"></div>
      <div id="modal-content"></div>
    </div>
    <iframe id="download"></iframe>
    <?php

  //////////////////////////////////////////////////////////////////
  // LOAD COMPONENTS
  //////////////////////////////////////////////////////////////////
  foreach($components as $component) {
    if(file_exists(COMPONENTS . "/" . $component . "/init.js")){
      echo('<script src="components/'.$component.'/init.js"></script>');
    }
  }

  foreach($plugins as $plugin){
    if(file_exists(PLUGINS . "/" . $plugin . "/init.js")){
      echo('<script src="plugins/'.$plugin.'/init.js"></script>');
    }
  }
}
    ?>
  </body>
</html>
