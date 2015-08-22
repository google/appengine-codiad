<script id="review-info-hb-template" type="text/x-handlebars-template">
<div class="review-info">
  <table class="codiad">
    <tr><td>Description: </td><td>{{description}}</td></tr>
  {{#if reviewers}}
    <tr><td>Reviewers: </td><td>{{reviewers}}</td></tr>
  {{/if}}
    <tr><td>Requester: </td><td>{{requester}}</td></tr>
    <tr><td>Review Ref: </td><td>{{reviewRef}}</td></tr>
    <tr><td>Target Ref: </td><td>{{targetRef}}</td></tr>
  <table>
</div>
</script>
<div id="review-pane" style="background-color: #1a1a1a;">
  <div id="review-top-bar">
    <button id="load-reviews-button" class="codiad"
            onclick="codiad.review.loadReviews(); return false;">
      Load Reviews
    </button>
    <img src="themes/default/loading.gif" id="review-loading-img"
         style="display: none;"/>
  </div>
  <div id="review-content">
    <div id="review-info-div"></div>
    <div id="review-level-comments"></div>
    <div id="code-comments"></div>
  </div>
</div>