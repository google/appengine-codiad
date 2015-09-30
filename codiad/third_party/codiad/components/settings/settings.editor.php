<?php
require_once('../../common.php');
?>
<label><span class="icon-home big-icon"></span><?php i18n("Editor Settings"); ?></label>
<hr>
<table class="codiad settings">
  <tr>
    <td width="50%"><?php i18n("Theme"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.theme">
        <optgroup label="Light Themes">
          <option value="default" selected>default</option>
          <option value="3024-day">3024-day</option>
          <option value="base16-light">base16-light</option>
          <option value="eclipse">eclipse</option>
          <option value="elegant">elegant</option>
          <option value="mdn-like">mdn-like</option>
          <option value="neat">neat</option>
          <option value="neo">neo</option>
          <option value="paraiso-light">paraiso-light</option>
          <option value="solarized light">solarized light</option>
          <option value="ttcn">ttcn</option>
          <option value="xq-light">xq-light</option>
        </optgroup>
        <optgroup label="Dark Themes">
          <option value="3024-night">3024-night</option>
          <option value="abcdef">abcdef</option>
          <option value="ambiance">ambiance</option>
          <option value="base16-dark">base16-dark</option>
          <option value="blackboard">blackboard</option>
          <option value="cobalt">cobalt</option>
          <option value="colorforth">colorforth</option>
          <option value="erlang-dark">erlang-dark</option>
          <option value="icecoder">icecoder</option>
          <option value="lesser-dark">lesser-dark</option>
          <option value="material">material</option>
          <option value="mbo">mbo</option>
          <option value="midnight">midnight</option>
          <option value="monokai">monokai</option>
          <option value="night">night</option>
          <option value="paraiso-dark">paraiso-dark</option>
          <option value="pastel-on-dark">pastel-on-dark</option>
          <option value="rubyblue">rubyblue</option>
          <option value="solarized dark">solarized dark</option>
          <option value="the-matrix">the-matrix</option>
          <option value="tomorrow-night-bright">tomorrow-night-bright</option>
          <option value="tomorrow-night-eighties">tomorrow-night-eighties</option>
          <option value="twilight">twilight</option>
          <option value="vibrant-ink">vibrant-ink</option>
          <option value="xq-dark">xq-dark</option>
          <option value="zenburn">zenburn</option>
        </optgroup>
      </select>

    </td>

  </tr>
  <tr>
    <td><?php i18n("Line Numbers"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.lineNumbers">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>

  </tr>
  <tr>
    <td><?php i18n("Wrap Lines"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.lineWrapping">
        <option value="false"><?php i18n("No"); ?></option>
        <option value="true" selected><?php i18n("Yes"); ?></option>
      </select>
    </td>

  </tr>
  <tr>
    <td><?php i18n("Tab Size"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.tabSize">
        <option value="2" selected>2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Spaces instead of Tabs"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.insertSoftTab">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Indent With Tabs"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.indentWithTabs">
        <option value="true"><?php i18n("Yes"); ?></option>
        <option value="false" selected><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Visible Tabs"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.visibleTabs">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Indent Unit"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.indentUnit">
        <option value="1">1</option>
        <option value="2" selected>2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
        <option value="6">6</option>
        <option value="7">7</option>
        <option value="8">8</option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Smart Indent"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.smartIndent">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Style Active Line"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.styleActiveLine">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Ruler Column"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.rulers">
        <option value="[]">No Ruler</option>
        <option value='[{"column": 80, "lineStyle": "dashed"}]'>80</option>
        <option value='[{"column": 90, "lineStyle": "dashed"}]'>90</option>
        <option value='[{"column": 100, "lineStyle": "dashed"}]' selected>100</option>
        <option value='[{"column": 110, "lineStyle": "dashed"}]'>110</option>
        <option value='[{"column": 120, "lineStyle": "dashed"}]'>120</option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Match Brackets"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.matchBrackets">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Auto Close Tags"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.autoCloseTags">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Auto Close Brackets"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.autoCloseBrackets">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Show Trailing Space"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.showTrailingSpace">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
  <tr>
    <td><?php i18n("Hints On Every Key"); ?></td>
    <td>
      <select class="codiad setting"
              onchange="codiad.settings.setSettings()"
              data-setting="codiad.settings.editor.showHintOnInput">
        <option value="true" selected><?php i18n("Yes"); ?></option>
        <option value="false"><?php i18n("No"); ?></option>
      </select>
    </td>
  </tr>
</table>
