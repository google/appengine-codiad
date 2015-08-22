<?php

/*
*  Copyright (c) Codiad & Kent Safranski (codiad.com), distributed
*  as-is and without warranty under the MIT License. See 
*  [root]/license.txt for more. This information must remain intact.
*/

require_once('../../common.php');

//////////////////////////////////////////////////////////////////
// Verify Session or Key
//////////////////////////////////////////////////////////////////

checkSession();

?>
<form onsubmit="return false;" class="codiad-form">
<?php

switch($_GET['action']){

    //////////////////////////////////////////////////////////////////
    // Confirm Close Unsaved File
    //////////////////////////////////////////////////////////////////
    case 'confirm':
    $path = $_GET['path'];
    ?>
    <label><?php i18n("Close Unsaved File?"); ?></label>
    
    <pre class="codiad"><?php echo($path); ?></pre>

    <button class="codiad " onclick="save_and_close('<?php echo($path); ?>'); return false;"><?php i18n("Save & Close"); ?></button>
    <button class="codiad " onclick="close_without_save('<?php echo($path); ?>'); return false;"><?php i18n("Discard Changes"); ?></button>
    <button class="codiad " onclick="codiad.modal.unload(); return false;"><?php i18n("Cancel"); ?></button>
    <?php
    break;

    case 'confirmAll':
    ?>
    <label><?php i18n("Close Unsaved Files?"); ?></label>
    
    <button class="codiad " onclick="save_and_close_all(); return false;"><?php i18n("Save & Close"); ?></button>
    <button class="codiad " onclick="close_without_save_all(); return false;"><?php i18n("Discard Changes"); ?></button>
    <button class="codiad " onclick="codiad.modal.unload(); return false;"><?php i18n("Cancel"); ?></button>
    <?php
    break;
    
}

?>
</form>
<script>

    function save_and_close(path){
        codiad.active.save(path);
        codiad.active.close(path);        
        codiad.modal.unload();
    }

    function close_without_save(path){
        codiad.active.close(path);        
        codiad.modal.unload();
    }

    function save_and_close_all(){
        codiad.active.saveAll();
        codiad.active.removeAll(true);
        codiad.modal.unload();
    }

    function close_without_save_all(){
        codiad.active.removeAll(true);
        codiad.modal.unload();
    }
</script>
