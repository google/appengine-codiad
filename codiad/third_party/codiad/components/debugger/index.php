<!-- Entire call stack. Embedded directly under '#dbg-pane-stack'. -->
<script id="dbg-pane-stack-template" type="text/x-handlebars-template">
{{#if condition}}
  <div class="dbg-stack-head padding-3px">Breakpoint Condition</div>
  <div class="padding-3px"><span class="padding-3px-lr">{{condition}}</span></div>
{{/if}}
{{#if evalExprs}}
  <div class="dbg-stack-head padding-3px">Watch Expressions</div>
  <table class="dbg-watch-exprs">
  {{#each evalExprs}}
    <tr>
      <td class="shrink">{{this.name}}</td>
      <td class="expand dbg-value-color">
        {{#if this.value}}
          {{this.value}}
        {{else}}
          <span class="dbg-err-info-color">(Invalid expression or not available)</span>
        {{/if}}
      </td>
    </tr>
  {{/each}}
  </table>
{{else}} {{#if userExprs}}
  <div class="dbg-stack-head padding-3px">Watch Expressions</div>
  <table class="dbg-watch-exprs">
  {{#each userExprs}}
    <tr><td class="shrink">{{this}}</td><td class="expand dbg-err-info-color">(Not evaluated yet)</td></tr>
  {{/each}}
  </table>
{{/if}} {{/if}}
<div class="dbg-stack-head padding-3px">Call Stack</div>
{{#if frames}}
  <div>
    {{#each frames}}
      <div class="dbg-stack-frame padding-3px">
        <div class="dbg-stack-frame-head">
          <span class="dbg-stack-frame-handle icon-right-dir"></span><span class="padding-3px-lr">{{this.function}}</span>
        </div>
      </div>
    {{/each}}
  </div>
{{else}}
  {{#if error}}
    <div class="padding-3px"><span class="padding-3px-lr">Breakpoint error:</span><span class="padding-3px-lr">{{desc}}</span></div>
  {{else}}
    <div class="padding-3px"><span class="padding-3px-lr">{{desc}}</span></div>
  {{/if}}
{{/if}}
</script>

<!-- Expanded stack frame. Embedded under '.dbg-stack-frame-details'. -->
<script id="dbg-pane-frame-template" type="text/x-handlebars-template">
<div class="dbg-stack-frame-details">
  {{#if frame}}
    <div class="dbg-stack-frame-loc">{{frame.location.path}}:{{frame.location.line}}</div>
    {{#if frame.arguments}}
      <div class="dbg-stack-frame-head2">Arguments:</div>
      {{#each frame.arguments}}
        {{#if this.isObj}}
          <div class="dbg-stack-frame-val objvar-{{this.varTableIndex}}">
            <span class="dbg-stack-frame-obj-head">
              <span class="dbg-stack-frame-handle icon-right-dir"></span>{{this.name}}
            </span>
          </div>
        {{else}}
          <div class="dbg-stack-frame-val">
            <span class="dbg-stack-frame-handle"></span>{{this.name}} =
            <span class="dbg-value-color">{{this.value}}</span>
          </div>
        {{/if}}
      {{/each}}
    {{/if}}
    {{#if frame.locals}}
      <div class="dbg-stack-frame-head2">Local variables:</div>
      {{#each frame.locals}}
        {{#if this.isObj}}
          <div class="dbg-stack-frame-val objvar-{{this.varTableIndex}}">
            <span class="dbg-stack-frame-obj-head">
              <span class="dbg-stack-frame-handle icon-right-dir"></span>{{this.name}}
            </span>
          </div>
        {{else}}
          <div class="dbg-stack-frame-val">
            <span class="dbg-stack-frame-handle"></span>{{this.name}} =
            <span class="dbg-value-color">{{this.value}}</span>
          </div>
        {{/if}}
      {{/each}}
    {{/if}}
  </div>
  {{else}}
    <div class="dbg-stack-frame-val dbg-err-info-color">(No detailed stack information available)</div>
  {{/if}}
</script>

<!-- Template for expanding an object variable. -->
<script id="dbg-pane-objvar-template" type="text/x-handlebars-template">
<div>
  {{#each fields}}
    {{#if this.isError}}
      <div class="dbg-stack-frame-val dbg-err-info-color">
        <span class="dbg-stack-frame-handle"></span>({{this.value}})
      </div>
    {{else}} {{#if this.isObj}}
      <div class="dbg-stack-frame-val objvar-{{this.varTableIndex}}">
        <span class="dbg-stack-frame-obj-head">
          <span class="dbg-stack-frame-handle icon-right-dir"></span>{{this.name}}
        </span>
      </div>
    {{else}}
      <div class="dbg-stack-frame-val">
        <span class="dbg-stack-frame-handle"></span>{{this.name}} =
        <span class="dbg-value-color">{{this.value}}</span>
      </div>
    {{/if}} {{/if}}
  {{/each}}
</div>
</script>

<!-- One row for a breakpoint. Embedded directly under '#dbg-pane-breakpoints'. -->
<script id="dbg-pane-breakpoint-row" type="text/x-handlebars-template">
<div class="breakpoint-row breakpoint-normal breakpointUid-{{uid}} padding-3px">
  <span class="padding-3px-lr">{{loc.path}}:{{loc.line}}</span>
  <span class="breakpoint-status padding-3px-lr"></span>
</div>
</script>

<div id="debugger-pane" style="display: none; background-color: #1a1a1a;">

  <div id="debugger-top-bar">
    <button id="debug-mode-button" class="codiad">Enable Debug Mode</button>
    <span class="icon-help-circled dbg-icon-help"
          title="Enable the Debug Mode to set or delete breakpoints by clicking line numbers of code. However, existing breakpoints may work normally even if not in the Debug Mode."></span>
  </div>

  <div id="debugger-content">

    <div id="dbg-pane-breakpoints">
      <div class="breakpoints-head padding-3px">Breakpoints</div>
    </div>

    <div id="dbg-pane-stack" class="dbg-pane-stack"></div>

  </div>
</div>
