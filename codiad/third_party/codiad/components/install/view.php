<div id="installer">
  <?php

/*
*  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
*  as-is and without warranty under the MIT License. See
*  [root]/license.txt for more. This information must remain intact.
*/

$path = rtrim(str_replace("index.php", "", $_SERVER['SCRIPT_FILENAME']),"/");

$workspace = is_writable( $path . "/workspace");
$data = is_writable($path . "/data");
$plugins = is_writable($path . "/plugins");
$themes = is_writable($path . "/themes");
$workspace = is_writable( $path . "/workspace");

$conf = $path . '/config.php';

$config = is_writable(file_exists($conf) ? $conf : $path);

if(ini_get('register_globals') == 1) {
  $register = true;
} else {
  $register = false;
}


$query = $_SERVER['QUERY_STRING'];

$autocomplete = array(
  'timezone' => '',
);

if (!empty($query)) {
  $params = explode('&', $query);
  foreach ($params as $param) {
    $param = explode('=', $param);
    if (array_key_exists($param[0], $autocomplete)) {
      $autocomplete[$param[0]] = urldecode($param[1]);
    }
  }
}

if(!$workspace || !$data || !$config || $register){
  ?>
  <h1>Installation Error</h1>
  <p>Please make sure the following exist and are writeable:</p>
  <div class="install_issues">
    <p>[SYSTEM]/config.php - <?php if($config) { echo '<font style="color:green">PASSED</font>'; } else { echo '<font style="color:red">ERROR</font>'; } ?></p>
    <p>[SYSTEM]/workspace - <?php if($workspace) { echo '<font style="color:green">PASSED</font>'; } else { echo '<font style="color:red">ERROR</font>'; } ?></p>
    <p>[SYSTEM]/plugins - <?php if($plugins) { echo '<font style="color:green">PASSED</font>'; } else { echo '<font style="color:red">ERROR</font>'; } ?></p>
    <p>[SYSTEM]/themes - <?php if($themes) { echo '<font style="color:green">PASSED</font>'; } else { echo '<font style="color:red">ERROR</font>'; } ?></p>
    <p>[SYSTEM]/data - <?php if($data) { echo '<font style="color:green">PASSED</font>'; } else { echo '<font style="color:red">ERROR</font>'; } ?></p> 
  </div>
  <?php if($register) { ?>
  <p>Please make sure these environmental variables are set:</p>
  <div class="install_issues">
    <?php if($register) { echo '<p>register_globals: Off</p>'; } ?>
  </div>
  <?php } ?>
  <button class="codiad" onclick="window.location.reload();">Re-Test</button>

  <?php
}else{
  ?>
  <form id="install" class="codiad-form">
    <h1>Initial setup in progress...</h1>

    <input type="hidden" name="path" value="<?php echo($path); ?>">

  </form>
  <?php
}
  ?>

</div>
<script>

  $(function(){

    $('html, body').css('overflow', 'auto');

    // Automatically select first timezone with the appropriate GMT offset
    function getTimeZoneString() {
      var num = new Date().getTimezoneOffset();
      if (num === 0) {
        return "GMT";
      } else {
        var hours = Math.floor(num / 60);
        var minutes = Math.floor((num - (hours * 60)));

        if (hours < 10) hours = "0" + Math.abs(hours);
        if (minutes < 10) minutes = "0" + Math.abs(minutes);

        return "GMT" + (num < 0 ? "+" : "-") + hours + ":" + minutes;
      }
    }
    var timezone = getTimeZoneString();
    $("[name=timezone] option").each(function() {
      if($(this).text().indexOf(timezone) > -1) $("[name=timezone]").val($(this).val());
    })

    $('#install').on('submit',function(e){
      e.preventDefault();

      // Check empty fields

      empty_fields = false;
      $('input').each(function(){
        if($(this).val()=='' && $(this).attr('name')!='path'){ empty_fields = true; }
      });

      if(empty_fields){ alert('All fields must be filled out'); }

      if(!empty_fields){
        $.post('components/install/process.php',$('#install').serialize(),function(data){
          if(data=='success'){
            window.location.reload();
          }else{
            alert("An Error Occoured<br><br>"+data);
          }
        });
      }

    });
  });

  $(document).ready(function() {
    setTimeout(function() { $('#install').submit(); }, 100);
  });
</script>
