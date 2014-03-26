angular.module('templates.app', ['accounts/account.tpl.html', 'footer.tpl.html', 'google-scholar/google-scholar-modal.tpl.html', 'header.tpl.html', 'infopages/about.tpl.html', 'infopages/collection.tpl.html', 'infopages/faq.tpl.html', 'infopages/landing.tpl.html', 'notifications.tpl.html', 'password-reset/password-reset-header.tpl.html', 'password-reset/password-reset.tpl.html', 'product/metrics-table.tpl.html', 'profile-award/profile-award.tpl.html', 'profile-linked-accounts/profile-linked-accounts.tpl.html', 'profile-product/edit-product-modal.tpl.html', 'profile-product/fulltext-location-modal.tpl.html', 'profile-product/percentilesInfoModal.tpl.html', 'profile-product/profile-product-page.tpl.html', 'profile-single-products/profile-single-products.tpl.html', 'profile/profile-embed-modal.tpl.html', 'profile/profile.tpl.html', 'profile/tour-start-modal.tpl.html', 'settings/custom-url-settings.tpl.html', 'settings/email-settings.tpl.html', 'settings/linked-accounts-settings.tpl.html', 'settings/password-settings.tpl.html', 'settings/profile-settings.tpl.html', 'settings/settings.tpl.html', 'signup/signup.tpl.html', 'update/update-progress.tpl.html']);

angular.module("accounts/account.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("accounts/account.tpl.html",
    "\n" +
    "\n" +
    "<div class=\"account-tile\" id=\"{{ account.CSSname }}-account-tile\"\n" +
    "     ng-class=\"{'is-linked': isLinked}\"\n" +
    "     ng-click=\"showAccountWindow()\">\n" +
    "\n" +
    "   <div class=\"account-name\"><img ng-src=\"{{ account.logoPath }}\"></div>\n" +
    "   <div class=\"linked-info\">\n" +
    "      <div class=\"linking-in-progress working\" ng-show=\"loading.is(account.accountHost)\">\n" +
    "         <i class=\"icon-refresh icon-spin\"></i>\n" +
    "         <div class=\"text\"></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"connected-toggle\" id=\"{{account.CSSname}}-account-toggle\"\n" +
    "           ng-show=\"!loading.is(account.accountHost)\">\n" +
    "\n" +
    "         <div class=\"toggle-housing toggle-on sync-{{ account.sync }}\" ng-show=\"isLinked\">\n" +
    "               <div class=\"toggle-state-label\" id=\"{{account.CSSname}}-account-toggle-on\">on</div>\n" +
    "               <div class=\"toggle-switch\"></div>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"toggle-housing toggle-off sync-{{ account.sync }}\" ng-show=\"!isLinked\">\n" +
    "               <div class=\"toggle-switch\"></div>\n" +
    "               <div class=\"toggle-state-label\" id=\"{{account.CSSname}}-account-toggle-off\">off</div>\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"overlay\"\n" +
    "     ng-click=\"onCancel()\"\n" +
    "     ng-if=\"accountWindowOpen\"\n" +
    "     ng-animate=\"{enter: 'animated fadeIn', leave: 'animated fadeOut'}\"></div>\n" +
    "\n" +
    "<div class=\"account-window-wrapper\"\n" +
    "     ng-if=\"accountWindowOpen\"\n" +
    "     ng-animate=\"{enter: 'animated slideInRight', leave: 'animated slideOutRight'}\">\n" +
    "   <div class=\"account-window\">\n" +
    "\n" +
    "      <div class=\"top-tab-wrapper\">\n" +
    "         <div ng-show=\"{{ account.sync }}\" class=\"top-tab sync-true syncing-now-{{ isLinked }}\" >\n" +
    "            <span ng-show=\"!isLinked\" class=\"syncing-status syncing-status-off\">\n" +
    "               Automatic import available\n" +
    "            </span>\n" +
    "            <span ng-show=\"isLinked\" class=\"syncing-status syncing-status-on\">\n" +
    "               <i class=\"icon-cloud-download left\"></i>\n" +
    "               Automatic import enabled\n" +
    "            </span>\n" +
    "         </div>\n" +
    "         <div ng-show=\"{{ !account.sync }}\" class=\"top-tab sync-false syncing-now-false\">Manual import available</div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"content\">\n" +
    "         <h2 class=\"account-name\" ng-show=\"!account.url\"><img ng-src=\"{{ account.logoPath }}\" /> </h2>\n" +
    "         <h2 class=\"account-name\" ng-show=\"account.url\">\n" +
    "            <a class=\"logo\" href=\"{{ account.url }}\" target=\"_blank\"><img ng-src=\"{{ account.logoPath }}\" /></a>\n" +
    "            <a class=\"visit\" href=\"{{ account.url }}\" target=\"_blank\">Visit<i class=\"icon-chevron-right\"></i></a>\n" +
    "         </h2>\n" +
    "\n" +
    "         <div class=\"descr\">{{ account.descr }}</div>\n" +
    "\n" +
    "         <form name=\"{{ account.name }}accountForm\"\n" +
    "               novalidate class=\"form\"\n" +
    "               ng-submit=\"onLink()\">\n" +
    "\n" +
    "\n" +
    "            <div class=\"form-group username\">\n" +
    "               <label class=\"control-label\">\n" +
    "                  {{ account.CSSname }} {{ account.username.inputNeeded }}\n" +
    "                  <i class=\"icon-question-sign\" ng-show=\"account.username.help\" tooltip-html-unsafe=\"{{ account.username.help }}\"></i>\n" +
    "               </label>\n" +
    "               <div class=\"account-input\">\n" +
    "                  <input\n" +
    "                          class=\"form-control\"\n" +
    "                          id=\"{{ account.CSSname }}-account-username-input\"\n" +
    "                          ng-model=\"account.username.value\"\n" +
    "                          ng-disabled=\"isLinked\"\n" +
    "                          type=\"text\"\n" +
    "                          autofocus=\"autofocus\"\n" +
    "                          placeholder=\"{{ account.username.placeholder }}\">\n" +
    "\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "            <div class=\"buttons-group save\">\n" +
    "               <div class=\"buttons\" ng-show=\"!loading.is('saveButton')\">\n" +
    "                  <button ng-show=\"!isLinked\" type=\"submit\"\n" +
    "                          id=\"{{ account.CSSname }}-account-username-submit\",                  \n" +
    "                          ng-class=\"{'btn-success': account.sync, 'btn-primary': !account.sync }\" class=\"btn\">\n" +
    "                     <i class=\"icon-link left\"></i>\n" +
    "                     Connect to {{ account.displayName }}\n" +
    "                  </button>\n" +
    "\n" +
    "                  <a ng-show=\"isLinked\" ng-click=\"unlink()\" class=\"btn btn-danger\">\n" +
    "                     <i class=\"icon-unlink left\"></i>\n" +
    "                     Disconnect from {{ account.displayName }}\n" +
    "                  </a>\n" +
    "\n" +
    "                  <a class=\"btn btn-default cancel\" ng-click=\"onCancel()\">Cancel</a>\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "\n" +
    "         </form>\n" +
    "\n" +
    "         <div class=\"extra\" ng-show=\"account.extra\" ng-bind-html-unsafe=\"account.extra\"></div>\n" +
    "\n" +
    "         <div class=\"google-scholar-stuff\"\n" +
    "              ng-show=\"account.accountHost=='google_scholar' && isLinked\">\n" +
    "            <p class=\"excuses\">\n" +
    "               Unfortunately, Google Scholar prevents automatic profile access,\n" +
    "               so we can't do automated updates.\n" +
    "               However, you can still import Google Scholar articles manually.\n" +
    "            </p>\n" +
    "            <div class=\"button-container\">\n" +
    "               <a id=\"show-google-scholar-import-modal-button\"\n" +
    "                  class=\"show-modal btn btn-primary\"\n" +
    "                  ng-click=\"showImportModal()\">\n" +
    "                  Manually import products\n" +
    "               </a>\n" +
    "\n" +
    "            </div>\n" +
    "\n" +
    "         </div>\n" +
    "\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("footer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("footer.tpl.html",
    "<div id=\"footer\" ng-show=\"page.showFooter()\">\n" +
    "   <div class=\"wrapper\">\n" +
    "\n" +
    "      <div id=\"footer-about\" class=\"footer-col\">\n" +
    "         <h3>About</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"/about\">About us</a></li>\n" +
    "            <li><a href=\"/faq#tos\" target=\"_self\">Terms of use</a></li>\n" +
    "            <li><a href=\"/faq#copyright\" target=\"_self\">Copyright</a></li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"footer-follow\" class=\"footer-col\">\n" +
    "         <h3>Community</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"http://twitter.com/#!/Impactstory\">Twitter</a></li>\n" +
    "            <li><a href=\"http://blog.impactstory.org\">Blog</a></li>\n" +
    "            <li><a href=\"mailto:team@impactstory.org?subject=Send me some free stickers!&Body=I'd like some of those keen Impactstory stickers all the kids are talking about. You can send them (for free!) to this address:\" target=\"_blank\">Free stickers!</a></li>\n" +
    "            <li><a href=\"https://github.com/total-impact\">GitHub</a></li>\n" +
    "            <!--<li><a href=\"http://twitter.com/#!/Impactstory_now\">Site status</a></li>-->\n" +
    "\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"footer-help\" class=\"footer-col\">\n" +
    "         <h3>Help</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"http://feedback.impactstory.org\" target=\"_blank\">Suggestions</a></li>\n" +
    "            <li>\n" +
    "               <a href=\"javascript:void(0)\" data-uv-lightbox=\"classic_widget\" data-uv-mode=\"full\" data-uv-primary-color=\"#cc6d00\" data-uv-link-color=\"#007dbf\" data-uv-default-mode=\"support\" data-uv-forum-id=\"166950\">Report bug</a>\n" +
    "            </li>\n" +
    "            <li><a href=\"/faq\">FAQ</a></li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div id=\"footer-funders\" class=\"footer-col\">\n" +
    "         <h3>Supported by</h3>\n" +
    "         <a href=\"http://nsf.gov\" id=\"footer-nsf-link\">\n" +
    "            <img src=\"/static/img/logos/nsf-seal.png\" />\n" +
    "         </a>\n" +
    "         <a href=\"http://sloan.org/\" id=\"footer-sloan-link\">\n" +
    "            <img src=\"/static/img/logos/sloan-seal.png\" />\n" +
    "         </a>\n" +
    "         <a href=\"http://www.jisc.ac.uk/\" id=\"footer-jisc-link\">\n" +
    "            <img src=\"/static/img/logos/jisc.png\" />\n" +
    "         </a>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div> <!-- end footer -->\n" +
    "");
}]);

angular.module("google-scholar/google-scholar-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("google-scholar/google-scholar-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Manually import Google Scholar articles</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"$close()\">&times;</a>\n" +
    "</div>\n" +
    "<div class=\"modal-body google-scholar-import\">\n" +
    "   <div class=\"import-not-complete\" ng-show=\"!importComplete\">\n" +
    "\n" +
    "      <p>\n" +
    "         Unfortunately, Google Scholar prevents automatic\n" +
    "         syncing. However, you can manually import your data. Here's how:\n" +
    "      </p>\n" +
    "\n" +
    "      <ol>\n" +
    "        <li>Go to <a class=\"your-google-scholar-profile\" target=\"_blank\" href=\"{{ currentUser.google_scholar_id }}\">your Google Scholar profile</a>.</li>\n" +
    "        <li>In the green bar above your articles, find the white dropdown box that says <code>Actions</code>.  Change this to <code>Export</code>. </li>\n" +
    "        <li>Click <code>Export all my articles</code>, then save the BiBTeX file.</li>\n" +
    "        <li>Return to Impactstory and upload your .bib file here.\n" +
    "      </ol>\n" +
    "\n" +
    "         <div class=\"file-input-container\">\n" +
    "            <input type=\"file\" ng-file-select=\"google_scholar_bibtex\">\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"submit\" ng-show=\"fileLoaded && !loading.is('bibtex')\">\n" +
    "            <a class=\"btn btn-primary\" ng-click=\"sendToServer()\">\n" +
    "               Import {{ googleScholar.bibtexArticlesCount() }} articles\n" +
    "            </a>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"working\" ng-show=\"loading.is('bibtex')\">\n" +
    "            <i class=\"icon-refresh icon-spin\"></i>\n" +
    "            <span class=\"text\">Adding articles...</span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "   <div class=\"import-complete\" ng-show=\"importComplete\">\n" +
    "      <div class=\"msg\">\n" +
    "      Successfully imported {{ importedProductsCount }} articles!\n" +
    "      </div>\n" +
    "      <a class=\"btn btn-info\" ng-click=\"$close()\">ok</a>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("header.tpl.html",
    "<div class=\"main-header header\" ng-show=\"page.showHeader()\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <a class=\"brand\" href=\"/\">\n" +
    "         <img src=\"/static/img/impactstory-logo-sideways.png\" alt=\"Impactstory\" />\n" +
    "      </a>\n" +
    "      <login-toolbar></login-toolbar>\n" +
    "   </div>\n" +
    "</div>\n" +
    "<div ng-show=\"page.showNotificationsIn('header')\" ng-include=\"'notifications.tpl.html'\" class=\"container-fluid\"></div>\n" +
    "\n" +
    "");
}]);

angular.module("infopages/about.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/about.tpl.html",
    "<div class=\"main infopage\" id=\"about\">\n" +
    "\n" +
    "   <div class=\"wrapper\">\n" +
    "      <h2 class=\"infopage-heading\">About</h2>\n" +
    "\n" +
    "\n" +
    "      <p>Impactstory is an open-source, web-based tool that helps researchers explore and share the diverse impacts of all their research products&mdash;from traditional ones like journal articles, to emerging products like blog posts, datasets, and software. By helping researchers tell data-driven stories about their impacts, we're helping to build a new scholarly reward system that values and encourages web-native scholarship. We’re funded by the National Science Foundation and the Alfred P. Sloan Foundation and incorporated as a 501(c)(3) nonprofit corporation.\n" +
    "\n" +
    "      <p>Impactstory delivers <em>open metrics</em>, with <em>context</em>, for <em>diverse products</em>:</p>\n" +
    "      <ul>\n" +
    "         <li><b>Open metrics</b>: Our data (to the extent allowed by providers’ terms of service), <a href=\"https://github.com/total-impact\">code</a>, and <a href=\"http://blog.impactstory.org/2012/03/01/18535014681/\">governance</a> are all open.</li>\n" +
    "         <li><b>With context</b>: To help researcher move from raw <a href=\"http://altmetrics.org/manifesto/\">altmetrics</a> data to <a href=\"http://asis.org/Bulletin/Apr-13/AprMay13_Piwowar_Priem.html\">impact profiles</a> that tell data-driven stories, we sort metrics by <em>engagement type</em> and <em>audience</em>. We also normalize based on comparison sets: an evaluator may not know if 5 forks on GitHub is a lot of attention, but they can understand immediately if their project ranked in the 95th percentile of all GitHub repos created that year.</li>\n" +
    "         <li><b>Diverse products</b>: Datasets, software, slides, and other research products are presented as an integrated section of a comprehensive impact report, alongside articles&mdash;each genre a first-class citizen, each making its own kind of impact.</li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <h3 id=\"team\">team</h3>\n" +
    "\n" +
    "      <div class=\"team-member first\">\n" +
    "         <img src=\"/static/img/heather.jpg\" height=100/>\n" +
    "         <p><strong>Heather Piwowar</strong> is a cofounder of Impactstory and a leading researcher in research data availability and data reuse. She wrote one of the first papers measuring the <a href=\"http://www.plosone.org/article/info:doi/10.1371/journal.pone.0000308\">citation benefit of publicly available research data</a>, has studied  <a href=\"http://www.plosone.org/article/info:doi/10.1371/journal.pone.0018657\">patterns in  data archiving</a>, <a href=\"https://peerj.com/preprints/1/\">patterns of data reuse</a>, and the <a href=\"http://researchremix.wordpress.com/2010/10/12/journalpolicyproposal\">impact of journal data sharing policies</a>.</p>\n" +
    "\n" +
    "         <p>Heather has a bachelor’s and master’s degree from MIT in electrical engineering, 10 years of experience as a software engineer, and a Ph.D. in Biomedical Informatics from the U of Pittsburgh.  She is an <a href=\"http://www.slideshare.net/hpiwowar\">frequent speaker</a> on research data archiving, writes a well-respected <a href=\"http://researchremix.wordpress.com\">research blog</a>, and is active on twitter (<a href=\"http://twitter.com/researchremix\">@researchremix</a>). </p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"team-member subsequent\">\n" +
    "         <img src=\"/static/img/hat.jpg\" height=100/>\n" +
    "         <p><strong>Jason Priem</strong> is a cofounder of Impactstory and a doctoral student in information science (currently on leave of absence) at the University of North Carolina-Chapel Hill. Since <a href=\"https://twitter.com/jasonpriem/status/25844968813\">coining the term \"altmetrics,\"</a> he's remained active in the field, organizing the annual <a href=\"http:altmetrics.org/altmetrics12\">altmetrics workshops</a>, giving <a href=\"http://jasonpriem.org/cv/#invited\">invited talks</a>, and publishing <a href=\"http://jasonpriem.org/cv/#refereed\">peer-reviewed altmetrics research.</a></p>\n" +
    "\n" +
    "         <p>Jason has contributed to and created several open-source software projects, including <a href=\"http://www.zotero.org\">Zotero</a> and <a href=\"http://feedvis.com\">Feedvis</a>, and has experience and training in art, design, and information visualisation.  Sometimes he writes on a <a href=\"http://jasonpriem.org/blog\">blog</a> and <a href=\"https://twitter.com/#!/jasonpriem\">tweets</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"team-member subsequent\">\n" +
    "         <img src=\"/static/img/stacy.jpg\" height=100/>\n" +
    "         <p><strong>Stacy Konkiel</strong> is the Director of Marketing & Research at Impactstory. A former academic librarian, Stacy has written and spoken most often about the potential for altmetrics in academic libraries.</p>\n" +
    "\n" +
    "         <p>Stacy has been an advocate for Open Scholarship since the beginning of her career, but credits her time at Public Library of Science (PLOS) with sparking her interest in altmetrics and other revolutions in scientific communication. Prior, she earned her dual master’s degrees in Information Science and Library Science at Indiana University (2008). You can connect with Stacy on Twitter at <a href=\"http://twitter.com/skonkiel\">@skonkiel</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"clearfix\"></div>\n" +
    "\n" +
    "\n" +
    "      <h3 id=\"history\">history</h3>\n" +
    "      <p>Impactstory began life as total-impact, a hackathon project at the Beyond Impact workshop in 2011. As the hackathon ended, a few of us migrated into a hotel hallway to continue working, eventually completing a 24-hour coding marathon to finish a prototype. Months of spare-time development followed, then funding.  We’ve got the same excitement for Impactstory today.</p>\n" +
    "\n" +
    "      <p>In early 2012, Impactstory was given £17,000 through the <a href=\"http://beyond-impact.org/\">Beyond Impact project</a> from the <a href=\"http://www.soros.org/\">Open Society Foundation</a>.  Today Impactstory is funded by the <a href=\"http://sloan.org/\">Alfred P. Sloan Foundation</a>, first through <a href=\"http://blog.impactstory.org/2012/03/29/20131290500/\">a $125,000 grant</a> in mid 2012 and then <a href=\"http://blog.impactstory.org/2013/06/17/sloan/\">a two-year grant for $500,000</a> starting in 2013.  We also received <a href=\"http://blog.impactstory.org/2013/09/27/impactstory-awarded-300k-nsf-grant/\">a $300,000 grant</a> from the National Science Foundation to study how automatically-gathered impact metrics can improve the reuse of research software. </p>\n" +
    "\n" +
    "      <h3 id=\"why\">philosophy</h3>\n" +
    "      <p>As a philanthropically-funded not-for-profit, we're in this because we believe open altmetrics are key for building the coming era of Web-native science. We're committed to:</p> <ul>\n" +
    "      <li><a href=\"https://github.com/total-impact\">open source</a></li>\n" +
    "      <li><a href=\"http://blog.impactstory.org/2012/06/08/24638498595/\">free and open data</a>, to the extent permitted by data providers</li>\n" +
    "      <li><a href=\"http://en.wikipedia.org/wiki/Radical_transparency\">Radical transparency</a> and <a href=\"http://blog.impactstory.org\">open communication</a></li>\n" +
    "   </ul>\n" +
    "\n" +
    "      <div id=\"contact\">\n" +
    "         <h3>Contact and FAQ</h3>\n" +
    "         <p>We'd love to hear your feedback, ideas, or just chat! Reach us at <a href=\"mailto:team@impactstory.org\">team@impactstory.org</a>, on <a href=\"http://twitter.com/#!/Impactstory\">Twitter</a>, or via our <a href=\"http://feedback.impactstory.org\">help forum.</a> Or if you've got questions, check out our <a href=\"/faq\">FAQ</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div><!-- end wrapper -->\n" +
    "</div>");
}]);

angular.module("infopages/collection.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/collection.tpl.html",
    "<div class=\"main infopage no-page\" id=\"collections\">\n" +
    "\n" +
    "   <div class=\"wrapper\">\n" +
    "      <h2 class=\"infopage-heading\">Retired</h2>\n" +
    "      <p class=\"info\">\n" +
    "         This old-style collection page has been retired.\n" +
    "         Check out our new <a href=\"http://blog.impactstory.org/2013/06/17/impact-profiles/\">profile pages!</a>\n" +
    "      </p>\n" +
    "   </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("infopages/faq.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/faq.tpl.html",
    "<div class=\"main infopage\" id=\"faq\"><div class=\"wrapper\">\n" +
    "   <h2 class=\"infopage-heading\">FAQ</h2>\n" +
    "\n" +
    "   <h3 id=\"what\" class=\"first\">what is Impactstory?</h3>\n" +
    "\n" +
    "   <p>Impactstory is an open-source, web-based tool that helps researchers explore and share the diverse impacts of all their research products&mdash;from traditional ones like journal articles, to emerging products like blog posts, datasets, and software. By helping researchers tell data-driven stories about their impacts, we're helping to build a new scholarly reward system that values and encourages web-native scholarship. We’re funded by the Alfred P. Sloan Foundation and incorporated as a nonprofit corporation.\n" +
    "\n" +
    "   <p>Impactstory delivers <em>open metrics</em>, with <em>context</em>, for <em>diverse products</em>:</p>\n" +
    "   <ul>\n" +
    "      <li><b>Open metrics</b>: Our data (to the extent allowed by providers’ terms of service), <a href=\"https://github.com/total-impact\">code</a>, and <a href=\"http://blog.impactstory.org/2012/03/01/18535014681/\">governance</a> are all open.</li>\n" +
    "      <li><b>With context</b>: To help researcher move from raw <a href=\"http://altmetrics.org/manifesto/\">altmetrics</a> data to <a href=\"http://asis.org/Bulletin/Apr-13/AprMay13_Piwowar_Priem.html\">impact profiles</a> that tell data-driven stories, we sort metrics by <em>engagement type</em> and <em>audience</em>. We also normalize based on comparison sets: an evaluator may not know if 5 forks on GitHub is a lot of attention, but they can understand immediately if their project ranked in the 95th percentile of all GitHub repos created that year.</li>\n" +
    "      <li><b>Diverse products</b>: Datasets, software, slides, and other research products are presented as an integrated section of a comprehensive impact report, alongside articles--each genre a first-class citizen, each making its own kind of impact.</li>\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"audience\">who is it for?</h3>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>researchers</b> who want to know how many times their work has been downloaded, bookmarked, and blogged\n" +
    "      <li><b>research groups</b> who want to look at the broad impact of their work and see what has demonstrated interest\n" +
    "      <li><b>funders</b> who want to see what sort of impact they may be missing when only considering citations to papers\n" +
    "      <li><b>repositories</b> who want to report on how their research products are being discussed\n" +
    "      <li><b>all of us</b> who believe that people should be rewarded when their work (no matter what the format) makes a positive impact (no matter what the venue). Aggregating evidence of impact will facilitate appropriate rewards, thereby encouraging additional openness of useful forms of research output.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"uses\">how should it be used?</h3>\n" +
    "\n" +
    "   <p>Impactstory data can be:</p>\n" +
    "   <ul>\n" +
    "      <li>highlighted as indications of the <em>minimum</em> impact a research product has made on the community\n" +
    "      <li>explored more deeply to see who is citing, bookmarking, and otherwise using your work\n" +
    "      <li>run to collect usage information for mention in biosketches\n" +
    "      <li>included as a link in CVs\n" +
    "      <li>analyzed by downloading detailed metric information\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"pooruses\">how <em>shouldn’t</em> it be used?</h3>\n" +
    "\n" +
    "   <p>Some of these issues relate to the early-development phase of Impactstory, some reflect our <a href=\"http://www.mendeley.com/groups/586171/altmetrics/papers/\">early-understanding of altmetrics</a>, and some are just common sense.  Impactstory reports shouldn't be used:\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>as indication of comprehensive impact</b>\n" +
    "         <p>Impactstory is in early development. See <a href=\"#limitations\">limitations</a> and take it all with a grain of salt.\n" +
    "\n" +
    "            <li><b>for serious comparison</b>\n" +
    "               <p>Impactstory is currently better at collecting comprehensive metrics for some products than others, in ways that are not clear in the report. Extreme care should be taken in comparisons. Numbers should be considered minimums. Even more care should be taken in comparing collections of products, since some Impactstory is currently better at identifying products identified in some ways than others. Finally, some of these metrics can be easily gamed. This is one reason we believe having many metrics is valuable.\n" +
    "\n" +
    "                  <li><b>as if we knew exactly what it all means</b>\n" +
    "                     <p>The meaning of these metrics are not yet well understood; see <a href=\"#meaning\">section</a> below.\n" +
    "\n" +
    "                        <li><b>as a substitute for personal judgement of quality</b>\n" +
    "         <p>Metrics are only one part of the story. Look at the research product for yourself and talk about it with informed colleagues.\n" +
    "\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"meaning\">what do these number actually mean?</h3>\n" +
    "\n" +
    "   <p>The short answer is: probably something useful, but we’re not sure what. We believe that dismissing the metrics as “buzz” is short-sighted: surely people bookmark and download things for a reason. The long answer, as well as a lot more speculation on the long-term significance of tools like Impactstory, can be found in the nascent scholarly literature on “altmetrics.”\n" +
    "\n" +
    "   <p><a href=\"http://altmetrics.org/manifesto/\">The Altmetrics Manifesto</a> is a good, easily-readable introduction to this literature. You can check out the shared <a href=\"http://www.mendeley.com/groups/586171/altmetrics/papers/\">altmetrics library</a> on Mendeley for a growing list of relevant research.\n" +
    "\n" +
    "   <h3 id=\"you-are-not-geting-all-my-citations\">you're not getting all my citations!</h3>\n" +
    "   <p>We'd love to display citation information from Google Scholar and Thomson Reuter's Web of Science in Impactstory, but sadly neither Google Scholar nor Web of Science allow us to do this. We're really pleased that Scopus has been more open with their data, allowing us to display their citation data on our website.  PubMed and Crossref are exemplars of open data: we display their citation counts on our website, in Impactstory widgets, and through our API.  As more citation databases open up, we'll include their data as fully as we can.</p>\n" +
    "\n" +
    "   <p>Each source of citation data gathers citations in its own ways, with their own strengths and limitations.  Web of Science gets  citation counts by manually gathering citations from a relatively small set of \"core\" journals.  Scopus and Google Scholar crawl a much more expansive set of publisher webpages, and Google also examines papers hosted elsewhere on the web.  PubMed looks at the reference sections of papers in PubMed Central, and CrossRef by looking at the reference lists that they see.  Google Scholar's scraping techniques and citation criteria are the most inclusive; the number of citations found by Google Scholar is typically the highest, though the least curated. A lot of folks have looked into the differences between citation counts from different providers, comparing Google Scholar, Scopus, and Web of Science and finding many differences; if you'd like to learn more, you might start with <a href=\"http://eprints.rclis.org/8605/\">this article.</a></p>\n" +
    "\n" +
    "\n" +
    "   <!--<h3 id=\"whichartifacts\">which identifiers are supported?</h3>\n" +
    "   <table class=\"permitted-artifact-ids\" border=1>\n" +
    "           <tr><th>artifact type</th><th>host</th><th>supported<br>ID format</th><th>example (id-type:id)</th><tr>\n" +
    "           <tr><td>published article</td><td>an article with a DOI</td><td>DOI</td><td><b>doi:</b>10.1371/journal.pcbi.1000361</td></tr>\n" +
    "           <tr><td>published article</td><td>an article in PubMed</td><td>PMID</td><td><b>pmid:</b>19304878</td></tr>\n" +
    "           <tr><td>dataset</td><td>Dryad or figshare</td><td>DOI</td><td><b>doi:</b>10.5061/dryad.1295</td></tr>\n" +
    "           <tr><td>software</td><td>GitHub</td><td>URL</td><td><b>url:</b>https://github.com/egonw/biostar-central</td></tr>\n" +
    "           <tr><td>slides</td><td>SlideShare</td><td>URL</td><td><b>url:</b>http://www.slideshare.net/phylogenomics/eisenall-hands</td></tr>\n" +
    "           <tr><td>generic</td><td>A conference paper, website resource, etc.</td><td>URL</td><td><b>url:</b>http://opensciencesummit.com/program/</td></tr>\n" +
    "   </table>-->\n" +
    "\n" +
    "   <h3 id=\"tos\">terms of use</h3>\n" +
    "   <p>Due to agreements we have made with data providers, you may not scrape this website -- use the embed or download funtionality instead.</p>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"copyright\">copyright</h3>\n" +
    "   <span class=\"text\">Except where otherwise noted, content on this site is licensed under the\n" +
    "      <a rel=\"license\" href=\"http://creativecommons.org/licenses/by/2.0/\">CC-BY license</a>.\n" +
    "   </span>\n" +
    "\n" +
    "   \n" +
    "\n" +
    "   <h3 id=\"whichmetrics\">which metrics are measured?</h3>\n" +
    "\n" +
    "   <p>Metrics are computed based on the following data sources (column names for CSV export are in parentheses):</p>\n" +
    "\n" +
    "   <ul id=\"providers-metadata\">\n" +
    "      <!-- the provider -->\n" +
    "      <li ng-repeat=\"provider in providers | orderBy: ['name']\">\n" +
    "         <a href=\"{{ provider.url }}\" class=\"provider-name\">{{ provider.name }}:</a> <span class=\"descr\">{{ provider.descr }}</span>\n" +
    "\n" +
    "         <ul>\n" +
    "            <!-- a metric supplied by this provider -->\n" +
    "            <li ng-repeat=\"(metric_name, metric) in provider.metrics\" class=\"metric\">\n" +
    "               <img src=\"{{ metric.icon }}\" width=\"16\" height=\"16\" />\n" +
    "               <strong>{{ metric.display_name }}</strong>\n" +
    "               <span class=\"metric-descr\">{{ metric.description }}</span>\n" +
    "               <span class=\"csv-name\">({{ provider.name }}:{{ metric_name }})</span>\n" +
    "            </li>\n" +
    "         </ul>\n" +
    "      </li>\n" +
    "   </ul>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"whereisif\">where is the journal impact factor?</h3>\n" +
    "\n" +
    "   <p>We do not include the Journal Impact Factor (or any similar proxy) on purpose. As has been <a href=\"https://www.zotero.org/groups/impact_factor_problems/items\">repeatedly shown</a>, the Impact Factor is not appropriate for judging the quality of individual research products. Individual article citations reflect much more about how useful papers actually were. Better yet are article-level metrics, as initiated by PLoS, in which we examine traces of impact beyond citation. Impactstory broadens this approach to reflect <b>product-level metrics</b>, by inclusion of preprints, datasets, presentation slides, and other research output formats.\n" +
    "\n" +
    "   <h3 id=\"similar\">where is my other favourite metric?</h3>\n" +
    "\n" +
    "   <p>We only include open metrics here, and so far only a selection of those. We welcome contributions of plugins. Write your own and tell us about it.\n" +
    "\n" +
    "   <p>Not sure Impactstory is your cup of tea?  Check out these similar tools:\n" +
    "   <ul>\n" +
    "      <li><a href=\"http://altmetric.com\">altmetric.com</a>\n" +
    "      <li><a href=\"http://www.plumanalytics.com/\">Plum Analytics</a>\n" +
    "      <li><a href=\"http://article-level-metrics.plos.org/\">PLoS Article-Level Metrics application</a>\n" +
    "      <li><a href=\"http://sciencecard.org/\">Science Card</a>\n" +
    "      <li><a href=\"http://citedin.org/\">CitedIn</a>\n" +
    "      <li><a href=\"http://readermeter.org/\">ReaderMeter</a>\n" +
    "   </ul>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"limitations\">what are the current limitations of the system?</h3>\n" +
    "\n" +
    "   <p>Impactstory is in early development and has many limitations. Some of the ones we know about:\n" +
    "\n" +
    "   <h4>gathering IDs sometimes misses products</h4>\n" +
    "   <ul>\n" +
    "      <li>ORCID and BibTex import sometimes can't parse or locate all objects.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>products are sometimes missing metrics</h4>\n" +
    "   <ul>\n" +
    "      <li>doesn’t display metrics with a zero value\n" +
    "      <li>sometimes the products were received without sufficient information to use all metrics. For example, the system sometimes can't figure out all URLs from a DOI.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>metrics sometimes have values that are too low</h4>\n" +
    "   <ul>\n" +
    "      <li>some sources have multiple records for a given product. Impactstory only identifies one copy and so only reports the impact metrics for that record. It makes no current attempt to aggregate across duplications within a source.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>other</h4>\n" +
    "   <ul>\n" +
    "      <li>the number of items on a report is currently limited.\n" +
    "   </ul>\n" +
    "\n" +
    "   Tell us about bugs! <a href=\"http://twitter.com/#!/Impactstory\">@Impactstory</a> (or via email to team@impactstory.org)\n" +
    "\n" +
    "   <h3 id=\"isitopen\">is this data Open?</h3>\n" +
    "\n" +
    "   <p>We’d like to make all of the data displayed by Impactstory available under CC0. Unfortunately, the terms-of-use of most of the data sources don’t allow that. We're trying to figure out how to handle this.\n" +
    "   <p>An option to restrict the displayed reports to Fully Open metrics — those suitable for commercial use — is on the To Do list.\n" +
    "   <p>The Impactstory software itself is fully open source under an MIT license. <a href=\"https://github.com/total-impact\">GitHub</a>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"who\">who developed Impactstory?</h3>\n" +
    "\n" +
    "   <p>Concept originally hacked at the <a href=\"http://beyond-impact.org/\">Beyond Impact Workshop</a>, part of the Beyond Impact project funded by the Open Society Foundations <a href=\"https://github.com/mhahnel/Total-Impact/contributors\">(initial contributors)</a>.  Here's the <a href=\"/about\">current team</a>.\n" +
    "\n" +
    "   <h3 id=\"funding\">who funds Impactstory?</h3>\n" +
    "\n" +
    "   <p>Early development was done on personal time, plus some discretionary time while funded through <a href=\"http://dataone.org\">DataONE</a> (Heather Piwowar) and a <a href=\"http://gradschool.unc.edu/programs/royster\">UNC Royster Fellowship</a> (Jason Priem).\n" +
    "\n" +
    "   <p>In early 2012, Impactstory was given £17,000 through the <a href=\"http://beyond-impact.org/\">Beyond Impact project</a> from the <a href=\"http://www.soros.org/\">Open Society Foundation</a>.  As of May 2012, Impactstory is funded through a $125k grant from the <a href=\"http://sloan.org/\">Alfred P. Sloan Foundation. </a>\n" +
    "\n" +
    "   <h3 id=\"learned\">what have you learned?</h3>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li>the multitude of IDs for a given product is a bigger problem than we guessed. Even articles that have DOIs often also have urls, PubMed IDs, PubMed Central IDs, Mendeley IDs, etc. There is no one place to find all synonyms, yet the various APIs often only work with a specific one or two ID types. This makes comprehensive impact-gathering time consuming and error-prone.\n" +
    "      <li>some data is harder to get than we thought (wordpress stats without requesting consumer key information)\n" +
    "      <li>some data is easier to get than we thought (vendors willing to work out special agreements, permit web scraping for particular purposes, etc)\n" +
    "      <li>lack of an author-identifier makes us reliant on user-populated systems like Mendeley for tracking author-based work (we need ORCID and we need it now!)\n" +
    "      <li>API limits like those on PubMed Central (3 request per second) make their data difficult to incorporate in this sort of application\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"howhelp\">how can I help?</h3>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>do you have data?</b> If it is already available in some public format, let us know so we can add it. If it isn’t, either please open it up or contact us to work out some mutually beneficial way we can work together.\n" +
    "      <li><b>do you have money?</b> We need money :) We need to fund future development of the system and are actively looking for appropriate opportunities.\n" +
    "      <li><b>do you have ideas?</b> Maybe enhancements to Impactstory would fit in with a grant you are writing, or maybe you want to make it work extra-well for your institution’s research outputs. We’re interested: please get in touch (see bottom).\n" +
    "      <li><b>do you have energy?</b> We need better “see what it does” documentation, better lists of collections, etc. Make some and tell us, please!\n" +
    "      <li><b>do you have anger that your favourite data source is missing?</b> After you confirm that its data isn't available for open purposes like this, write to them and ask them to open it up... it might work. If the data is open but isn't included here, let us know to help us prioritize.\n" +
    "      <li><b>can you email, blog, post, tweet, or walk down the hall to tell a friend?</b> See the <a href=\"#cool\">this is so cool</a> section for your vital role....\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"cool\">this is so cool.</h3>\n" +
    "\n" +
    "   <p>Thanks! We agree :)\n" +
    "   <p>You can help us.  Demonstrating the value of Impactstory is key to receiving future funding.\n" +
    "   <p>Buzz and testimonials will help. Tweet your reports. Blog, send email, and show off Impactstory at your next group meeting to help spread the word.\n" +
    "   <p>Tell us how cool it is at <a href=\"http://twitter.com/#!/Impactstory\">@Impactstory</a> (or via email to team@impactstory.org) so we can consolidate the feedback.\n" +
    "\n" +
    "   <h3 id=\"suggestion\">I have a suggestion!</h3>\n" +
    "\n" +
    "   <p><b>We want to hear it.</b> Send it to us at <a href=\"http://twitter.com/#!/Impactstory\">@Impactstory</a> (or via email to team@impactstory.org).\n" +
    "\n" +
    "\n" +
    "</div><!-- end wrapper -->\n" +
    "</div><!-- end faq -->\n" +
    "</div>");
}]);

angular.module("infopages/landing.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/landing.tpl.html",
    "<div class=\"main infopage landing\">\n" +
    "   <div class=\"toolbar-container\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <login-toolbar></login-toolbar>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   <div class=\"top-screen\" fullscreen> <!-- this needs to be set to the viewport height-->\n" +
    "\n" +
    "      <div id=\"tagline\">\n" +
    "         <div class=\"wrapper\">\n" +
    "            <img class=\"big-logo\" src=\"/static/img/impactstory-logo-no-type.png\" alt=\"\"/>\n" +
    "            <h1>Discover the full impact<br> of your research.</h1>\n" +
    "            <!--<p class=\"subtagline\">Impactstory is your impact profile on the web: we reveal the diverse impacts of your articles, datasets, software, and more.</p>-->\n" +
    "            <div id=\"call-to-action\">\n" +
    "               <a href=\"/signup\" class=\"btn btn-xlarge btn-primary primary-action\" id=\"signup-button\">What's my impact?</a>\n" +
    "               <a href=\"/CarlBoettiger\"\n" +
    "                  ng-show=\"page.isTestVersion('b')\"\n" +
    "                  class=\"btn btn-xlarge btn-default\"\n" +
    "                  id=\"secondary-cta-button\">See an example</a>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"bottom-of-top-screen\">\n" +
    "         <div class=\"featured-and-supported\">\n" +
    "            <h3>featured in and supported by</h3>\n" +
    "            <img src=\"/static/img/logos/bbc.png\" />\n" +
    "            <img src=\"/static/img/logos/nature.png\" />\n" +
    "            <img src=\"/static/img/logos/chronicle.png\"/>\n" +
    "\n" +
    "            <span class=\"divider\"></span>\n" +
    "\n" +
    "            <img src=\"/static/img/logos/jisc.png\" />\n" +
    "            <img src=\"/static/img/logos/sloan.png\" />\n" +
    "            <img src=\"/static/img/logos/nsf.png\" />\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"ask-for-more\">\n" +
    "            <span>more <i class=\"icon-chevron-down\"></i></span>\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <div id=\"selling-points\">\n" +
    "      <ul class=\"wrapper\">\n" +
    "         <li>\n" +
    "            <h3><i class=\"icon-bar-chart icon-3x\"></i><span class=\"text\">Citations and more</span></h3>\n" +
    "            <p>Find out where your work has been cited, viewed, downloaded, tweeted, and more.</p>\n" +
    "         </li>\n" +
    "         <li class=\"middle\">\n" +
    "            <h3><i class=\"icon-globe icon-3x\"></i><span class=\"text\">All your outputs</span></h3>\n" +
    "            <p>Discover and share the impacts of your articles, slides, datasets, and software.</p>\n" +
    "         </li>\n" +
    "         <li>\n" +
    "            <h3 id=\"its-open\"><i class=\"icon-unlock-alt icon-3x\"></i><span class=\"text\">Open and free</span></h3>\n" +
    "            <p>Your profile is free, the data behind it is open, and our code is open-source.</p>\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div id=\"testimonials\">\n" +
    "      <ul class=\"wrapper\">\n" +
    "         <li>\n" +
    "            <img src=\"/static/img/people/luo.png\"/>\n" +
    "            <q class=\"text\">I don't need my CV now, Impactstory tells my story!</q>\n" +
    "            <cite>Ruibang Luo, Hong Kong University</cite>\n" +
    "         </li>\n" +
    "\n" +
    "         <li>\n" +
    "            <img src=\"/static/img/people/graziotin.jpeg\"/>\n" +
    "            <q class=\"text\">Every time I look at my Impactstory profile, I see that I did some good things and somebody actually noticed them. There is so much besides the number of citations. </q>\n" +
    "            <cite>Daniel Graziotin, Free University of Bozen-Bolzano</cite>\n" +
    "         </li>\n" +
    "\n" +
    "\n" +
    "      </ul>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"bottom-cta\">\n" +
    "      <div id=\"call-to-action\">\n" +
    "         <a href=\"/signup\" class=\"btn btn-large btn-primary primary-action\" id=\"create-collection\">What's my impact?</a>\n" +
    "         <!--<a href=\"/CarlBoettiger\" class=\"btn btn-large btn-primary secondary-action\" id=\"view-sample-collection\">Show me a sample profile</a>-->\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("notifications.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("notifications.tpl.html",
    "<ul class=\"notifications\">\n" +
    "   <li ng-class=\"['alert', 'alert-'+notification.type]\"\n" +
    "       ng-repeat=\"notification in notifications.getCurrent()\">\n" +
    "       <span class=\"text\" ng-bind-html-unsafe=\"notification.message\"></span>\n" +
    "       <button class=\"close\" ng-click=\"removeNotification(notification)\">&times;</button>\n" +
    "   </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("password-reset/password-reset-header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("password-reset/password-reset-header.tpl.html",
    "<div class=\"password-reset-header\">\n" +
    "   <h1><a class=\"brand\" href=\"/\">\n" +
    "      <img src=\"/static/img/impactstory-logo-white.png\" alt=\"Impactstory\" /></a>\n" +
    "      <span class=\"text\">password reset</span>\n" +
    "   </h1>\n" +
    "</div>\n" +
    "<div ng-include=\"'notifications.tpl.html'\" class=\"container-fluid\"></div>\n" +
    "");
}]);

angular.module("password-reset/password-reset.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("password-reset/password-reset.tpl.html",
    "<div class=\"password-reset\">\n" +
    "   <form novalidate\n" +
    "         name=\"passwordResetForm\"\n" +
    "         class=\"form-horizontal password-reset\"\n" +
    "         ng-submit=\"onSave()\"\n" +
    "         ng-controller=\"passwordResetFormCtrl\"\n" +
    "        >\n" +
    "\n" +
    "      <!--<div class=\"inst\">\n" +
    "         Enter your new password:\n" +
    "      </div>-->\n" +
    "\n" +
    "      <div class=\"form-group new-password\">\n" +
    "         <label class=\"control-label sr-only\">New password</label>\n" +
    "         <div class=\"controls \">\n" +
    "            <input ng-model=\"password\"\n" +
    "                   name=\"newPassword\"\n" +
    "                   type=\"password\"\n" +
    "                   ng-show=\"!showPassword\"\n" +
    "                   class=\"form-control input-lg\"\n" +
    "                   placeholder=\"new password\"\n" +
    "                   required>\n" +
    "\n" +
    "            <input ng-model=\"password\"\n" +
    "                   name=\"newPassword\"\n" +
    "                   type=\"text\"\n" +
    "                   ng-show=\"showPassword\"\n" +
    "                   class=\"form-control input-lg\"\n" +
    "                   placeholder=\"new password\"\n" +
    "                   required>\n" +
    "         </div>\n" +
    "         <div class=\"controls show-password\">\n" +
    "            <pretty-checkbox value=\"showPassword\" text=\"Show\"></pretty-checkbox>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"form-group submit\">\n" +
    "         <div>\n" +
    "            <save-buttons></save-buttons>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "   </form>\n" +
    "</div>");
}]);

angular.module("product/metrics-table.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product/metrics-table.tpl.html",
    "<ul class=\"metric-details-list\">\n" +
    "   <li ng-repeat=\"metric in metrics | orderBy: ['-award.isHighly', '-award.audience']\" class=\"metric-detail\">\n" +
    "      <span class=\"badge-container\">\n" +
    "         <span\n" +
    "               class=\"ti-badge lil-badge {{metric.award.audience}} {{metric.award.engagementType}}\"\n" +
    "               ng-show=\"!metric.award.isHighly\"\n" +
    "               popover-trigger=\"mouseenter\"\n" +
    "               popover-placement=\"bottom\"\n" +
    "               popover-title=\"{{metric.award.engagementType}} by {{metric.award.displayAudience}}\"\n" +
    "               popover=\"This item has {{metric.actualCount}} {{metric.environment}}\n" +
    "               {{metric.displayInteraction}}, suggesting it's been\n" +
    "               {{metric.award.engagementType}} by {{metric.award.displayAudience}}.\">\n" +
    "            <span class=\"engagement-type\">{{metric.award.engagementType}}</span>\n" +
    "            <span class=\"audience\">by {{metric.award.audience}}</span>\n" +
    "          </span>\n" +
    "\n" +
    "         <span\n" +
    "               class=\"ti-badge big-badge {{metric.award.audience}} {{metric.award.engagementType}}\"\n" +
    "               ng-show=\"metric.award.isHighly\"\n" +
    "               popover-trigger=\"mouseenter\"\n" +
    "               popover-placement=\"bottom\"\n" +
    "               popover-title=\"Highly {{metric.award.engagementType}} by {{metric.award.displayAudience}}\"\n" +
    "               popover=\"This item has {{metric.actualCount}} {{metric.environment}}\n" +
    "               {{metric.displayInteraction}}. That's better than\n" +
    "               {{metric.percentiles.CI95_lower}}% of items\n" +
    "               {{metric.referenceSetStorageVerb}} {{metric.refSet}} in {{metric.referenceSetYear}},\n" +
    "               suggesting it's highly {{metric.award.engagementType}} by {{metric.award.displayAudience }}.\">\n" +
    "            <span class=\"modifier\">highly</span>\n" +
    "            <span class=\"engagement-type\">{{metric.award.engagementType}}</span>\n" +
    "            <span class=\"audience\">by {{metric.award.audience}}</span>\n" +
    "         </span>\n" +
    "\n" +
    "      </span>\n" +
    "      <span class=\"text\">\n" +
    "         <a class=\"value-and-name\"\n" +
    "            href=\"{{ metric.provenance_url }}\"\n" +
    "            target=\"_blank\"\n" +
    "            popover-trigger='mouseenter'\n" +
    "            popover-placement=\"bottom\"\n" +
    "            popover=\"{{ metric.static_meta.description }}. Click to see more details on {{ metric.environment }}.\">\n" +
    "            <img ng-src=\"{{ metric.static_meta.icon }}\">\n" +
    "            <span class=\"raw-value\">{{ metric.actualCount }}</span>\n" +
    "            <span class=\"environment\">{{ metric.environment }}</span>\n" +
    "            <span class=\"interaction\">{{ metric.displayInteraction }}</span>\n" +
    "            <i class=\"icon-external-link-sign\"></i>\n" +
    "         </a>\n" +
    "         <span class=\"percentile\" ng-show=\"metric.percentiles\">\n" +
    "            <span class=\"values\">\n" +
    "               <span class=\"lower\">{{ metric.percentiles.CI95_lower }}</span>\n" +
    "               <span class=\"dash\">-</span>\n" +
    "               <span class=\"upper\">{{ metric.percentiles.CI95_upper }}</span>\n" +
    "               <span class=\"unit\">percentile</span>\n" +
    "               <i class=\"icon-info-sign\" ng-click=\"openInfoModal()\"></i>\n" +
    "            </span>\n" +
    "            <span class=\"descr\">of {{ biblio.genre }}s published in {{ biblio.year }}</span>\n" +
    "         </span>\n" +
    "      </span>\n" +
    "\n" +
    "   </li>\n" +
    "</ul>");
}]);

angular.module("profile-award/profile-award.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-award/profile-award.tpl.html",
    "<div class=\"award-container\" ng-show=\"!currentUserIsProfileOwner() && profileAward.award_badge\">\n" +
    "   <span class=\"profile-award\"\n" +
    "        ng-controller=\"ProfileAwardCtrl\"\n" +
    "        popover=\"{{ user.about.given_name }} has made {{ profileAward.level_justification }}\"\n" +
    "        popover-title=\"{{ profileAward.level_name }} level award\"\n" +
    "        popover-trigger=\"hover\"\n" +
    "        popover-placement=\"bottom\"\n" +
    "        ng-show=\"profileAward.level>0\">\n" +
    "\n" +
    "      <span class=\"icon level-{{ profileAward.level }}\">\n" +
    "         <i class=\"icon-unlock-alt\"></i>\n" +
    "      </span>\n" +
    "      <span class=\"text\">{{ profileAward.name }}</span>\n" +
    "\n" +
    "   </span>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"award-container\" ng-show=\"currentUserIsProfileOwner() && profileAward.award_badge\">\n" +
    "   <span class=\"profile-award\"\n" +
    "        ng-controller=\"ProfileAwardCtrl\"\n" +
    "        popover=\"You've made {{ profileAward.level_justification }} Nice work! <div class='call-to-action'>{{ profileAward.needed_for_next_level }} {{ profileAward.call_to_action }}</div>\"\n" +
    "        popover-title=\"{{ profileAward.level_name }} level award\"\n" +
    "        popover-trigger=\"hover\"\n" +
    "        popover-placement=\"bottom\"\n" +
    "        ng-show=\"profileAward.level>0\">\n" +
    "\n" +
    "      <span class=\"icon level-{{ profileAward.level }}\">\n" +
    "         <i class=\"icon-unlock-alt\"></i>\n" +
    "      </span>\n" +
    "      <span class=\"text\">{{ profileAward.name }}</span>\n" +
    "\n" +
    "   </span>\n" +
    "   <a href=\"https://twitter.com/share\" class=\"twitter-share-button\" data-url=\"http://impactstory.org/{{ url_slug }}?utm_source=sb&utm_medium=twitter\" data-text=\"I got a new badge on my Impactstory profile: {{ profileAward.level_name }}-level {{ profileAward.name }}!\" data-via=\"impactstory\" data-count=\"none\"></a>\n" +
    "</div>");
}]);

angular.module("profile-linked-accounts/profile-linked-accounts.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-linked-accounts/profile-linked-accounts.tpl.html",
    "<div class=\"profile-linked-accounts profile-subpage\" >\n" +
    "   <div class=\"profile-accounts-header profile-subpage-header\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <a back-to-profile></a>\n" +
    "         <h1 class=\"instr\">Connect to other accounts</h1>\n" +
    "         <h2>We'll automatically import your products from all over the web,\n" +
    "            so your profile stays up to date.</h2>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"accounts\">\n" +
    "      <div class=\"account\"\n" +
    "           ng-repeat=\"account in accounts\"\n" +
    "           ng-controller=\"accountCtrl\"\n" +
    "           ng-include=\"'accounts/account.tpl.html'\">\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("profile-product/edit-product-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-product/edit-product-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$close()\">&times;</button>\n" +
    "   <h3>Edit product</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body edit-product\">\n" +
    "   <form\n" +
    "           name=\"editProductForm\"\n" +
    "           novalidate\n" +
    "           ng-submit=\"onSave()\"\n" +
    "           ng-controller=\"editProductFormCtrl\">\n" +
    "\n" +
    "      <div class=\"form-group\">\n" +
    "         <label>Title</label>\n" +
    "         <textarea\n" +
    "           class=\"form-control\"\n" +
    "           required\n" +
    "           name=\"productTitle\"\n" +
    "           ng-model=\"product.biblio.title\"></textarea>\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"from-group\">\n" +
    "         <label>Authors</label>\n" +
    "         <textarea\n" +
    "           class=\"form-control\"\n" +
    "           name=\"productAuthors\"\n" +
    "           ng-model=\"product.biblio.authors\"></textarea>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <save-buttons ng-show=\"editProductForm.$valid && editProductForm.$dirty\"\n" +
    "                    valid=\"editProductForm.$valid\"></save-buttons>\n" +
    "\n" +
    "   </form>\n" +
    "</div>\n" +
    "");
}]);

angular.module("profile-product/fulltext-location-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-product/fulltext-location-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$close()\">&times;</button>\n" +
    "   <h3>Add link to free fulltext</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body free-fulltext-url\">\n" +
    "\n" +
    "   <div class=\"add-link\">\n" +
    "      <p>Is there a free version of this article, outside any paywalls?\n" +
    "         <strong>Nice!</strong>\n" +
    "      </p>\n" +
    "\n" +
    "      <form\n" +
    "              name=\"freeFulltextUrlForm\"\n" +
    "              novalidate\n" +
    "              ng-submit=\"onSave()\"\n" +
    "              ng-controller=\"freeFulltextUrlFormCtrl\">\n" +
    "         <div class=\"input-group\">\n" +
    "            <span class=\"input-group-addon icon-globe\"></span>\n" +
    "            <input\n" +
    "                    class=\"free-fulltext-url form-control\"\n" +
    "                    type=\"url\"\n" +
    "                    name=\"freeFulltextUrl\"\n" +
    "                    required\n" +
    "                    placeholder=\"Paste the link here\"\n" +
    "                    ng-model=\"free_fulltext_url\" />\n" +
    "         </div>\n" +
    "         <save-buttons ng-show=\"freeFulltextUrlForm.$valid && freeFulltextUrlForm.$dirty\"\n" +
    "                       valid=\"freeFulltextUrlForm.$valid\"></save-buttons>\n" +
    "\n" +
    "      </form>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"archive-this\">\n" +
    "      Is your work hidden behind a paywall? Let's fix that!\n" +
    "      Upload a version to figshare, where everyone can read it for free:\n" +
    "      <a class=\"btn btn-success\" href=\"http://figshare.com\" target=\"_blank\">\n" +
    "         <span class=\"icon-unlock-alt\"></span>\n" +
    "         upload a free version\n" +
    "      </a>\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("profile-product/percentilesInfoModal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-product/percentilesInfoModal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$close()\">&times;</button>\n" +
    "   <h3>What do these numbers mean?</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "   <p>Impactstory classifies metrics along two dimensions: <strong>audience</strong> (<em>scholars</em> or the <em>public</em>) and <strong>type of engagement</strong> with research (<em>view</em>, <em>discuss</em>, <em>save</em>, <em>cite</em>, and <em>recommend</em>).</p>\n" +
    "\n" +
    "   <p>For each metric, the coloured bar shows its percentile relative to all articles indexed in the Web of Science that year.  The bars show a range, representing the 95% confidence interval around your percentile (and also accounting for ties).  Along with ranges, we show “Highly” badges for metrics above the 75th percentile that exceed a minimum frequency.</p>\n" +
    "\n" +
    "   <p>Each metric's raw count is shown to the left of its name.  Click the raw count to visit that metric source's external page for the item; there, you can explore the engagement in more detail.</p>\n" +
    "\n" +
    "   <p>For more information, see these blog posts and <a href=\"{{ url_for('faq') }}\">FAQ</a> sections:</p>\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><a href=\"http://blog.impactstory.org/2012/09/10/31256247948/\">What do we expect?</a></li>\n" +
    "      <li><a href=\"http://blog.impactstory.org/2012/09/14/31524247207/\">Our framework for classifying altmetrics</a></li>\n" +
    "      <li>Reference sets: <a href=\"http://blog.impactstory.org/2012/09/13/31461657926/\">Motivation</a>; Choosing Web of Science (TBA)</li>\n" +
    "      <li>Percentiles: <a href=\"http://blog.impactstory.org/2012/09/11/31342582590/\">Part 1</a>, <a href=\"http://blog.impactstory.org/2012/09/12/31408899657/\">Part 2</a>, and <a href=\"http://blog.impactstory.org/2012/09/12/31411187588/\">Part 3</a></li>\n" +
    "      <li>Why <a href=\"{{ url_for('faq') }}#toc_3_9\">citation counts may not be what you expect</a></li>\n" +
    "      <li>Sampling and 95% confidence (TBA)</li>\n" +
    "   </ul>\n" +
    "</div>");
}]);

angular.module("profile-product/profile-product-page.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-product/profile-product-page.tpl.html",
    "<div class=\"product-page profile-subpage\">\n" +
    "   <div class=\"header profile-subpage-header product-page-header\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <a back-to-profile></a>\n" +
    "         <div class=\"product-page-controls\" ng-show=\"userOwnsThisProfile\">\n" +
    "            <a class=\"edit-product\"\n" +
    "               ng-click=\"editProduct()\"\n" +
    "               tooltip=\"Make changes to this product's title or authors\"\n" +
    "               tooltip-placement=\"bottom\">\n" +
    "               <span class=\"ready\" ng-show=\"!loading.is()\">\n" +
    "                  <i class=\"icon-edit\"></i>\n" +
    "                  Edit\n" +
    "               </span>\n" +
    "               <span class=\"working\" ng-show=\"loading.is('deleteProduct')\">\n" +
    "                  <i class=\"icon-refresh icon-spin\"></i>\n" +
    "                  Removing...\n" +
    "               </span>\n" +
    "            </a>\n" +
    "\n" +
    "            <a class=\"delete-product\"\n" +
    "               ng-click=\"deleteProduct()\"\n" +
    "               tooltip=\"Remove this product from your profile.\"\n" +
    "               tooltip-placement=\"bottom\">\n" +
    "               <span class=\"ready\">\n" +
    "                  <i class=\"icon-trash\"></i>\n" +
    "                  Remove\n" +
    "               </span>\n" +
    "            </a>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   <div class=\"content wrapper\">\n" +
    "      <div class=\"working\" ng-show=\"loading.is('profileProduct')\">\n" +
    "         <i class=\"icon-refresh icon-spin\"></i>\n" +
    "         <span class=\"text\">Loading product...</span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div  class=\"product\">\n" +
    "\n" +
    "         <div class=\"biblio-container\" ng-bind-html-unsafe=\"product.markup.biblio\"></div>\n" +
    "\n" +
    "         <div class=\"free-fulltext-url well\" ng-show=\"!loading.is('profileProduct') && (product.genre=='article' || product.genre=='report')\">\n" +
    "            <div class=\"no-free-fulltext-url\" ng-show=\"!product.biblio.free_fulltext_url\">\n" +
    "               <div class=\"info\">\n" +
    "                  <i class=\"icon-warning-sign leader\"></i>\n" +
    "                  <div class=\"no-fulltext\">\n" +
    "                     Your article has no free fulltext available.\n" +
    "                  </div>\n" +
    "                  <div class=\"encouragement\">\n" +
    "                     <!-- @TODO FIX THIS. we can't depend on the OA award being first in awards list -->\n" +
    "                     {{ profileAwards[0].extra.needed_for_next_level_product_page }}\n" +
    "                  </div>\n" +
    "               </div>\n" +
    "               <div class=\"action\">\n" +
    "                  <a class=\"action btn btn-danger btn-xs\" ng-click=\"openFulltextLocationModal()\">Link to free fulltext</a>\n" +
    "               </div>\n" +
    "\n" +
    "            </div>\n" +
    "            <div class=\"has-free-fulltext-url\" ng-show=\"product.biblio.free_fulltext_url\">\n" +
    "               <i class=\"icon-unlock-alt leader\"></i>\n" +
    "               Free fulltext available at\n" +
    "               <a href=\"{{ product.biblio.free_fulltext_url }}\" target=\"_blank\">\n" +
    "                  {{ getDomain(product.biblio.free_fulltext_url) }}\n" +
    "                  <i class=\"icon-external-link-sign\"></i>\n" +
    "               </a>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"metrics-container\" ng-bind-html-unsafe=\"product.markup.metrics\"></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <a class=\"percentile-info\" ng-click=\"openInfoModal()\"\n" +
    "         ng-show=\"!loading.is('profileProduct') && product.has_percentiles\">\n" +
    "         <icon class=\"icon-question-sign\"></icon>\n" +
    "         Where do these percentiles come from?\n" +
    "      </a>\n" +
    "\n" +
    "   </div>\n" +
    "</div>");
}]);

angular.module("profile-single-products/profile-single-products.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-single-products/profile-single-products.tpl.html",
    "<div class=\"profile-single-products profile-subpage\" >\n" +
    "   <div class=\"profile-single-products-header profile-subpage-header\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <a back-to-profile></a>\n" +
    "         <h1 class=\"instr\">Import individual products</h1>\n" +
    "         <h2>Add products to Impactstory profile one-by-one. For easier importing,\n" +
    "            link your external accounts and we'll sync them automatically.</h2>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"profile-single-products-body\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <form name=\"import-single-products\"\n" +
    "               ng-submit=\"onSubmit()\"\n" +
    "               ng-controller=\"ImportSingleProductsFormCtrl\">\n" +
    "            <textarea class=\"form-control\"\n" +
    "                      name=\"single-produts\"\n" +
    "                      ng-model=\"newlineDelimitedProductIds\"\n" +
    "                      placeholder=\"Paste products IDs here, one per line\"\n" +
    "                      id=\"single-products-importer\">\n" +
    "             </textarea>\n" +
    "            <save-buttons action=\"Import\"></save-buttons>\n" +
    "         </form>\n" +
    "\n" +
    "         <div class=\"id-sources\">\n" +
    "             <h3>Supported ID types:</h3>\n" +
    "            <ul class=\"accepted-ids\">\n" +
    "               <li><span class=\"id-type\">Article PMIDs</span><img src=\"/static/img/logos/pubmed.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Article DOIs</span><img src=\"/static/img/logos/crossref.jpg\" /></li>\n" +
    "               <li><span class=\"id-type\">Dataset DOIs</span><img src=\"/static/img/logos/dryad.png\" /><img src=\"/static/img/logos/figshare.png\" /></li>\n" +
    "               <li><span class=\"id-type\">GitHub repo URLs</span><img src=\"/static/img/logos/github.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Webpage URLs</span><img src=\"/static/img/logos/products-by-url.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Slide deck URLs</span><img src=\"/static/img/logos/slideshare.png\" /></li>\n" +
    "               <li><span class=\"id-type\">Video URLs</span><img src=\"/static/img/logos/vimeo.png\" /><img src=\"/static/img/logos/youtube.png\" /></li>\n" +
    "            </ul>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("profile/profile-embed-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/profile-embed-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Embed profile</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"$close()\">&times;</a>\n" +
    "</div>\n" +
    "<div class=\"modal-body embed\">\n" +
    "   <label>\n" +
    "        <input type=\"radio\" name=\"embed-type\"\n" +
    "               value=\"link\" ng-model=\"embed.type\" />\n" +
    "      <span class=\"text\">Embed a <br><strong>link to this profile</strong></span>\n" +
    "      <img src=\"static/img/impactstory-logo.png\" alt=\"Impactstory logo\"/>\n" +
    "    </label>\n" +
    "\n" +
    "   <label>\n" +
    "        <input type=\"radio\" name=\"embed-type\"\n" +
    "               value=\"profile\" ng-model=\"embed.type\" />\n" +
    "      <span class=\"text\">Embed this <br><strong>whole profile at full size</strong></span>\n" +
    "      <img src=\"static/img/embedded-profile-example.png\" alt=\"Impactstory profile\"/>\n" +
    "    </label>\n" +
    "\n" +
    "\n" +
    "   <div class=\"code\">\n" +
    "      <div class=\"embed-profile\" ng-show=\"embed.type=='profile'\">\n" +
    "         <h3>Paste this code in your page source HTML:</h3>\n" +
    "         <textarea rows=\"3\">&lt;iframe src=\"{{ baseUrl() }}/embed/{{ userSlug }}\" width=\"100%\" height=\"600\"&gt;&lt;/iframe&gt;</textarea>\n" +
    "      </div>\n" +
    "      <div class=\"embed-link\" ng-show=\"embed.type=='link'\">\n" +
    "         <h3>Paste this code in your page source HTML:</h3>\n" +
    "         <textarea rows=\"3\">&lt;a href=\"{{ baseUrl() }}/{{ userSlug }}\"&gt;&lt;img src=\"{{ baseUrl() }}/logo/small\" width=\"200\" /&gt;&lt;/a&gt;</textarea>\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("profile/profile.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/profile.tpl.html",
    "<div class=\"profile-header\" ng-show=\"userExists\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <div class=\"loading\" ng-show=\"!user.about.id\">\n" +
    "         <div class=\"working\"><i class=\"icon-refresh icon-spin\"></i><span class=\"text\">Loading profile info...</span></div>\n" +
    "      </div>\n" +
    "      <div class=\"my-picture\" ng-show=\"user.about.id\">\n" +
    "         <a href=\"http://www.gravatar.com\" >\n" +
    "            <img class=\"gravatar\" ng-src=\"http://www.gravatar.com/avatar/{{ user.about.email_hash }}?s=110&d=mm\" data-toggle=\"tooltip\" class=\"gravatar\" rel=\"tooltip\" title=\"Modify your icon at Gravatar.com\" />\n" +
    "         </a>\n" +
    "      </div>\n" +
    "      <div class=\"my-vitals\">\n" +
    "         <h2 class='page-title editable-name' id=\"profile-owner-name\">\n" +
    "            <span class=\"given-name editable\" data-name=\"given_name\">{{ user.about.given_name }}</span>\n" +
    "            <span class=\"surname editable\" data-name=\"surname\">{{ user.about.surname }}</span>\n" +
    "         </h2>\n" +
    "         <div class=\"connected-accounts\">\n" +
    "            <ul>\n" +
    "\n" +
    "               <li ng-show=\"user.about.figshare_id\" style=\"display: none;\">\n" +
    "                  <a href=\"{{ user.about.figshare_id }}\">\n" +
    "                     <img src=\"http://figshare.com/static/img/favicon.png\">\n" +
    "                     <span class=\"service\">figshare</span>\n" +
    "                  </a>\n" +
    "               </li>           \n" +
    "               <li ng-show=\"user.about.github_id\" style=\"display: none;\">\n" +
    "                  <a href=\"https://github.com/{{ user.about.github_id }}\">\n" +
    "                     <img src=\"https://github.com/fluidicon.png\">\n" +
    "                     <span class=\"service\">GitHub</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "               <li ng-show=\"user.about.google_scholar_id\" style=\"display: none;\">\n" +
    "                  <a href=\"{{ user.about.google_scholar_id }}\">\n" +
    "                     <img src=\"http://scholar.google.com/favicon.ico\">\n" +
    "                     <span class=\"service\">Google Scholar</span>\n" +
    "                  </a>\n" +
    "               </li>     \n" +
    "               <li ng-show=\"user.about.orcid_id\" style=\"display: none;\">\n" +
    "                  <a href=\"https://orcid.org/{{ user.about.orcid_id }}\">\n" +
    "                     <img src=\"http://orcid.org/sites/about.orcid.org/files/orcid_16x16.ico\">\n" +
    "                     <span class=\"service\">ORCID</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "\n" +
    "               <li ng-show=\"user.about.slideshare_id\" style=\"display: none;\">\n" +
    "                  <a href=\"https://www.slideshare.net/{{ user.about.slideshare_id }}\">\n" +
    "                     <img src=\"http://www.slideshare.net/favicon.ico\">\n" +
    "                     <span class=\"service\">Slideshare</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "\n" +
    "               </li>\n" +
    "            </ul>\n" +
    "\n" +
    "            <div class=\"add-connected-account\" ng-show=\"currentUserIsProfileOwner()\">\n" +
    "               <a href=\"/{{ user.about.url_slug }}/accounts\" class=\"btn btn-xs btn-info\">\n" +
    "                  <i class=\"icon-link left\"></i>\n" +
    "                  <span ng-show=\"!hasConnectedAccounts()\" class=\"first\">Import from accounts</span>\n" +
    "                  <span ng-show=\"hasConnectedAccounts()\" class=\"more\">Connect more accounts</span>\n" +
    "               </a>\n" +
    "            </div>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"my-metrics\">\n" +
    "         <ul class=\"profile-award-list\">\n" +
    "            <li class=\"profile-award-container level-{{ profileAward.level }}\"\n" +
    "                ng-include=\"'profile-award/profile-award.tpl.html'\"\n" +
    "                ng-repeat=\"profileAward in profileAwards\">\n" +
    "            </li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"product-controls\" ng-show=\"userExists\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <div class=\"edit-controls btn-group\">\n" +
    "         <div class=\"num-items\">\n" +
    "            <span class=\"products-done-updating\" ng-show=\"!productsStillUpdating\">\n" +
    "               <span ng-hide=\"loadingProducts()\" class=\"val-plus-text\">\n" +
    "                  <span class=\"value\" id=\"number-products\">{{ filterProducts(products).length }}</span> research products\n" +
    "               </span>\n" +
    "               <a ng-click=\"showProductsWithoutMetrics = !showProductsWithoutMetrics\" ng-show=\"showProductsWithoutMetrics\">\n" +
    "                  (hide <span class=\"value\">{{ filterProducts(products, \"withoutMetrics\").length }}</span> without metrics)\n" +
    "               </a>\n" +
    "            </span>\n" +
    "            <span ng-show=\"productsStillUpdating\" class=\"products-still-updating\" id=\"products-still-updating\">\n" +
    "               Products still updating...\n" +
    "            </span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"view-controls\">\n" +
    "         <!--<a><i class=\"icon-refresh\"></i>Refresh metrics</a>-->\n" +
    "         <div class=\"admin-controls\" ng-show=\"currentUserIsProfileOwner() && !page.isEmbedded()\">\n" +
    "            <a href=\"/{{ user.about.url_slug }}/products/add\">\n" +
    "               <i class=\"icon-upload\"></i>Import products one-by-one\n" +
    "            </a>\n" +
    "            <a ng-click=\"dedup()\"\n" +
    "               ng-class=\"{working: loading.is('dedup')}\"\n" +
    "               class=\"dedup-button\">\n" +
    "               <span class=\"content ready\" ng-show=\"!loading.is('dedup')\">\n" +
    "                  <i class=\"icon-copy\"></i>\n" +
    "                  <span class=\"text\">Merge duplicates</span>\n" +
    "               </span>\n" +
    "               <span class=\"content working\" ng-show=\"loading.is('dedup')\">\n" +
    "                  <i class=\"icon-refresh icon-spin\" ng-show=\"loading.is('dedup')\"></i>\n" +
    "                  <span class=\"text\">Merging duplicates</span>\n" +
    "               </span>\n" +
    "            </a>\n" +
    "         </div>\n" +
    "         <div class=\"everyone-controls\">\n" +
    "            <a ng-click=\"openProfileEmbedModal()\" ng-show=\"!page.isEmbedded()\">\n" +
    "               <i class=\"icon-suitcase\"></i>\n" +
    "               Embed\n" +
    "            </a>\n" +
    "            <span class=\"dropdown download\">\n" +
    "               <a id=\"adminmenu\" role=\"button\" class=\"dropdown-toggle\"><i class=\"icon-download\"></i>Download</a>\n" +
    "               <ul class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"adminmenu\">\n" +
    "                  <li><a tabindex=\"-1\" href=\"{{ page.getBaseUrl }}/user/{{ user.about.url_slug }}/products.csv\" target=\"_self\"><i class=\"icon-table\"></i>csv</a></li>\n" +
    "                  <li><a tabindex=\"-1\" href=\"{{ page.getBaseUrl }}/user/{{ user.about.url_slug }}/products\" target=\"_blank\"><i class=\"json\">{&hellip;}</i>json</a></li>\n" +
    "               </ul>\n" +
    "            </span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"products\" ng-show=\"userExists\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <div class=\"loading\" ng-show=\"loadingProducts()\">\n" +
    "         <div class=\"working products-loading\"><i class=\"icon-refresh icon-spin\"></i><span class=\"text\">Loading products...</span></div>\n" +
    "      </div>\n" +
    "\n" +
    "      <ul class=\"products-list\">\n" +
    "         <li class=\"product {{ product.genre }}\"\n" +
    "             ng-class=\"{'heading': product.is_heading, 'real-product': !product.is_heading, first: $first}\"\n" +
    "             ng-repeat=\"product in products | orderBy:['genre', 'account', 'is_heading', '-awardedness_score', '-metric_raw_sum']\"\n" +
    "             ng-controller=\"productCtrl\"\n" +
    "             ng-show=\"product.has_metrics || showProductsWithoutMetrics || product.is_heading\"\n" +
    "             id=\"{{ product._id }}\"\n" +
    "             on-repeat-finished>\n" +
    "\n" +
    "            <div class=\"biblio-container\" ng-bind-html-unsafe=\"product.markup.biblio\"></div>\n" +
    "            <div class=\"metrics-container\" ng-bind-html-unsafe=\"product.markup.metrics\"></div>\n" +
    "\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"products-without-metrics wrapper\"\n" +
    "        ng-show=\"!loadingProducts() && !showProductsWithoutMetrics && filterProducts(products, 'withoutMetrics').length\">\n" +
    "      <div class=\"well\">\n" +
    "         Another <span class=\"value\">{{ filterProducts(products, \"withoutMetrics\").length }}</span> products aren't shown, because we couldn't find any impact data for them.\n" +
    "         <a ng-click=\"showProductsWithoutMetrics = !showProductsWithoutMetrics\">Show these, too.</a>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"user-does-not-exist no-page\" ng-show=\"!userExists\">\n" +
    "   <h2>Whoops!</h2>\n" +
    "   <p>We don't have a user account for <span class=\"slug\">'{{ slug }}.'</span><br> Would you like to <a href=\"/signup\">make one?</a></p>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"signup-banner\"\n" +
    "     ng-show=\"userExists && !isAuthenticated()\"\n" +
    "     ng-if=\"!hideSignupBanner\"\n" +
    "     ng-animate=\"{leave: 'animated fadeOutDown'}\">\n" +
    "\n" +
    "   <span class=\"msg\">Join {{ user.about.given_name }} and thousands of other scientists on Impactstory!</span>\n" +
    "   <a class=\"signup-button btn btn-primary btn-sm\" ng-click=\"clickSignupLink()\" href=\"/signup\">Make your free profile</a>\n" +
    "   <a class=\"close-link\" ng-click=\"hideSignupBannerNow()\">&times;</a>\n" +
    "</div>");
}]);

angular.module("profile/tour-start-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/tour-start-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Welcome to Impactstory, {{ userAbout.given_name }}!</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"$close()\">&times;</a>\n" +
    "</div>\n" +
    "<div class=\"modal-body tour-start\">\n" +
    "   <p>\n" +
    "      This is your Impactstory profile page, where you can explore, edit, and share\n" +
    "      your impact data. It's always accessible at\n" +
    "      <span class=\"url\">impactstory.org/{{ userAbout.url_slug }}</span>\n" +
    "   </p>\n" +
    "\n" +
    "   <p>\n" +
    "     Before you share, though, you'll want to import some of your research products from around the web:\n" +
    "   </p>\n" +
    "\n" +
    "   <a class=\"btn btn-primary\"\n" +
    "      ng-click=\"$close()\"\n" +
    "      href=\"/{{ userAbout.url_slug }}/accounts\">\n" +
    "      Import my products\n" +
    "      <i class=\"icon-cloud-upload left\"></i>\n" +
    "   </a>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("settings/custom-url-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/custom-url-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Custom URL</h1>\n" +
    "   <p>Customize the URL people use to reach your profile</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate name=\"userUrlForm\" class=\"form-horizontal custom-url\" ng-submit=\"onSave()\" ng-controller=\"urlSettingsCtrl\">\n" +
    "   <div class=\"form-group custom-url\"\n" +
    "        ng-model=\"user.url_slug\"\n" +
    "        ng-class=\"{ 'has-error':  userUrlForm.url_slug.$invalid && userUrlForm.url_slug.$dirty && !loading.is(),\n" +
    "                    'has-success': userUrlForm.url_slug.$valid && userUrlForm.url_slug.$dirty && !loading.is() }\">\n" +
    "\n" +
    "      <div class=\"controls input-group col-sm-9\">\n" +
    "         <span class=\"input-group-addon\">impactstory.org/</span>\n" +
    "         <input ng-model=\"user.url_slug\"\n" +
    "                name=\"url_slug\"\n" +
    "                class=\"form-control\"\n" +
    "                required\n" +
    "                data-require-unique\n" +
    "                ng-pattern=\"/^[-\\w\\.]+$/\"\n" +
    "                 />\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div class=\"feedback col-sm-3\">\n" +
    "\n" +
    "         <div class=\"help-block checking one-line\" ng-show=\"loading.is('requireUnique')\">\n" +
    "            <i class=\"icon-refresh icon-spin\"></i>\n" +
    "            <span class=\"text\">Checking...</span>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"help-block error\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$error.pattern\n" +
    "               && userUrlForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            This URL has invalid characters.\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"help-block error\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$error.requireUnique\n" +
    "               && userUrlForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            Someone else is using that URL.\n" +
    "         </div>\n" +
    "         <div class=\"help-block success one-line\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$valid\n" +
    "               && userUrlForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            Looks good!\n" +
    "         </div>\n" +
    "         <div class=\"help-block\"\n" +
    "               ng-show=\"userUrlForm.url_slug.$pristine\n" +
    "               && !loading.is()\">\n" +
    "            This is your current URL.\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-10\">\n" +
    "         <save-buttons valid=\"userUrlForm.$valid\"></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/email-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/email-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "  <h1>Email</h1>\n" +
    "  <p>Change email address used for login and contact</p>\n" +
    "</div>\n" +
    "\n" +
    "<form novalidate name=\"userEmailForm\" class=\"form-horizontal custom-url\" ng-submit=\"onSave()\" ng-controller=\"emailSettingsCtrl\">\n" +
    "  <div class=\"form-group change-email\"\n" +
    "  ng-model=\"user.email\"\n" +
    "  ng-class=\"{ 'has-error':  userEmailForm.email.$invalid && userEmailForm.email.$dirty && !loading.is(),\n" +
    "                    'has-success': userEmailForm.email.$valid && userEmailForm.email.$dirty && !loading.is()}\">\n" +
    "\n" +
    "    <div class=\"controls input-group col-sm-9\">\n" +
    "      <span class=\"input-group-addon\"><i class=\"icon-envelope-alt\"></i></span>\n" +
    "      <input ng-model=\"user.email\"\n" +
    "      name=\"email\"\n" +
    "      class=\"form-control\"\n" +
    "      required\n" +
    "      data-require-unique\n" +
    "      />\n" +
    "\n" +
    "    </div>\n" +
    "    <div class=\"feedback col-sm-3\">\n" +
    "       <spinner msg=\"Checking\"></spinner>\n" +
    "\n" +
    "       <div class=\"help-block error\"\n" +
    "       ng-show=\"userEmailForm.email.$error.requireUnique\n" +
    "               && userEmailForm.email.$dirty\n" +
    "               && !loading.is()\">\n" +
    "       Address is already in use.\n" +
    "       </div>\n" +
    "       <div class=\"help-block success one-line\"\n" +
    "       ng-show=\"userEmailForm.email.$valid\n" +
    "               && userEmailForm.email.$dirty\n" +
    "               && !loading.is()\">\n" +
    "       Looks good!\n" +
    "       </div>\n" +
    "       <div class=\"help-block\"\n" +
    "       ng-show=\"userEmailForm.email.$pristine\n" +
    "               && !loading.is()\">\n" +
    "       This is your current email.\n" +
    "       </div>\n" +
    "    </div>\n" +
    "\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"form-group submit\">\n" +
    "  <div class=\" col-xs-10\">\n" +
    "    <save-buttons valid=\"userEmailForm.$valid\"></save-buttons>\n" +
    "  </div>\n" +
    "  </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/linked-accounts-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/linked-accounts-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Linked accounts</h1>\n" +
    "   <p>Pull in products and metrics from elsewhere</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate name=\"userProfileForm\"\n" +
    "      class=\"form-horizontal linked-accounts-settings\"\n" +
    "      ng-submit=\"onSave()\"\n" +
    "      ng-controller=\"linkedAccountsSettingsCtrl\">\n" +
    "\n" +
    "   <div class=\"form-group linked-account\">\n" +
    "      <label class=\"control-label col-sm-3 two-lines\">Wordpress.com API key</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <input ng-model=\"user.wordpress_api_key\" name=\"wordpress_api_key\" class=\"form-control\">\n" +
    "         <p>If you've already imported a <a href=\"http://wordpress.com\">Wordpress.com</a> blog, this key lets us display your readership counts.</p>\n" +
    "         <p>You can find your WordPress.com API key <a href='http://akismet.com/resend/' target='_blank'>here, via Akismet.</a></p>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <!--\n" +
    "   <div class=\"form-group linked-account\">\n" +
    "      <label class=\"control-label col-sm-3\">Twitter</label>\n" +
    "      <div class=\"is-linked col-sm-9\" ng-if=\"user.twitter_account_id\">\n" +
    "         <span class=\"account-id\">{{ user.twitter_account_id }}</span>\n" +
    "         <a class=\"remove-account\"><i class=\"icon-trash\">remove</i></a>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   -->\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-offset-3 col-sm-7\">\n" +
    "         <save-buttons valid=\"userProfileForm.$valid\"></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/password-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/password-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Password</h1>\n" +
    "   <p>Change your account password.</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate\n" +
    "      name=\"userPasswordForm\"\n" +
    "      class=\"change-password form-horizontal\"\n" +
    "      ng-submit=\"onSave()\"\n" +
    "      ng-controller=\"passwordSettingsCtrl\"\n" +
    "      >\n" +
    "\n" +
    "   <div class=\"form-group current-password\" ng-class=\"{'has-error': wrongPassword}\">\n" +
    "      <label class=\"control-label col-sm-4\">Current password</label>\n" +
    "      <div class=\"controls col-sm-6\">\n" +
    "         <input ng-model=\"user.currentPassword\" name=\"currentPassword\" type=\"password\" class=\"form-control\" required ng-show=\"!showPassword\">\n" +
    "         <input ng-model=\"user.currentPassword\" name=\"currentPassword\" type=\"text\" class=\"form-control\" required ng-show=\"showPassword\">\n" +
    "      </div>\n" +
    "      <div class=\"controls col-sm-2 show-password\">\n" +
    "         <pretty-checkbox value=\"showPassword\" text=\"Show\"></pretty-checkbox>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group new-password\">\n" +
    "      <label class=\"control-label col-sm-4\">New password</label>\n" +
    "      <div class=\"controls col-sm-6\">\n" +
    "         <input ng-model=\"user.newPassword\"\n" +
    "                name=\"newPassword\"\n" +
    "                type=\"password\"\n" +
    "                ng-show=\"!showPassword\"\n" +
    "                class=\"form-control\"\n" +
    "                required>\n" +
    "\n" +
    "         <input ng-model=\"user.newPassword\"\n" +
    "                name=\"newPassword\"\n" +
    "                type=\"text\"\n" +
    "                ng-show=\"showPassword\"\n" +
    "                class=\"form-control\"\n" +
    "                required>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-offset-4 col-sm-6\">\n" +
    "         <save-buttons></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/profile-settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/profile-settings.tpl.html",
    "<div class=\"settings-header\">\n" +
    "   <h1>Profile</h1>\n" +
    "   <p>Modify what's displayed in your profile.</p>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<form novalidate name=\"userProfileForm\" class=\"form-horizontal\" ng-submit=\"onSave()\" ng-controller=\"profileSettingsCtrl\">\n" +
    "\n" +
    "   <div class=\"form-group photo\">\n" +
    "      <label class=\"control-label col-sm-3\">Photo</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <div class=\"my-picture\">\n" +
    "            <a href=\"http://www.gravatar.com\" >\n" +
    "               <img class=\"gravatar\" ng-src=\"http://www.gravatar.com/avatar/{{ user.email_hash }}?s=110&d=mm\" data-toggle=\"tooltip\" class=\"gravatar\" rel=\"tooltip\" title=\"Modify your icon at Gravatar.com\" />\n" +
    "            </a>\n" +
    "            <p>You can change your profile image at <a href=\"http://www.gravatar.com\">Gravatar.com</a></p>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <label class=\"control-label col-sm-3\">First name</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <input ng-model=\"user.given_name\" name=\"givenname\" class=\"form-control\">\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <label class=\"control-label col-sm-3\">Surname</label>\n" +
    "      <div class=\"controls col-sm-7\">\n" +
    "         <input ng-model=\"user.surname\" name=\"surname\" class=\"form-control\">\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-sm-offset-3 col-sm-7\">\n" +
    "         <save-buttons valid=\"userProfileForm.$valid\"></save-buttons>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</form>\n" +
    "");
}]);

angular.module("settings/settings.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("settings/settings.tpl.html",
    "<div class=\"wrapper settings\">\n" +
    "   <div class=\"settings-nav \">\n" +
    "      <ul nav-list nav>\n" +
    "         <li ng-repeat=\"pageDescr in pageDescriptions\">\n" +
    "            <a ng-class=\"{selected: isCurrentPath(pageDescr.urlPath)}\"\n" +
    "               href=\"{{ pageDescr.urlPath }}\">\n" +
    "               {{ pageDescr.displayName }}\n" +
    "               <i class=\"icon-chevron-right\"></i>\n" +
    "            </a>\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"settings-input\" ng-include='include'></div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("signup/signup.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup.tpl.html",
    "<div class=\"signup-page\">\n" +
    "   <div class=\"signup-main-page\">\n" +
    "      <div class=\"form-container\">\n" +
    "         <h1>Reveal your full scholarly impact.</h1>\n" +
    "         <h2>Signup for your <strong>free</strong> Impactstory profile:</h2>\n" +
    "         <form novalidate\n" +
    "               name=\"signupForm\"\n" +
    "               ng-controller=\"signupFormCtrl\"\n" +
    "               ng-submit=\"signup()\"\n" +
    "               id=\"main-signup-form\"\n" +
    "               class=\"form-horizontal signup-form\">\n" +
    "\n" +
    "            <div class=\"inputs\">\n" +
    "               <div class=\"form-group\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-given-name\">First name</label>\n" +
    "                  <input ng-model=\"newUser.givenName\"\n" +
    "                         placeholder=\"First name\"\n" +
    "                         type=\"text\"\n" +
    "                         id=\"signup-given-name\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         autofocus=\"autofocus\"\n" +
    "                         required />\n" +
    "               </div>\n" +
    "\n" +
    "               <div class=\"form-group\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-surname\">Last name</label>\n" +
    "                  <input ng-model=\"newUser.surname\"\n" +
    "                         placeholder=\"Last name\"\n" +
    "                         id=\"signup-surname\"\n" +
    "                         type=\"text\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         required />\n" +
    "               </div>\n" +
    "\n" +
    "\n" +
    "               <div class=\"form-group\" ng-class=\"{'has-error': emailTaken()}\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-email\">Email</label>\n" +
    "                  <input ng-model=\"newUser.email\"\n" +
    "                         placeholder=\"Email\"\n" +
    "                         id=\"signup-email\"\n" +
    "                         type=\"email\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         required />\n" +
    "                  <div class=\"help-block\" ng-show=\"emailTaken()\">Sorry, that email is taken.</div>\n" +
    "               </div>\n" +
    "\n" +
    "               <div class=\"form-group\">\n" +
    "                  <label class=\"sr-only\" for=\"signup-password\">Password</label>\n" +
    "                  <input ng-model=\"newUser.password\"\n" +
    "                         placeholder=\"Password\"\n" +
    "                         id=\"signup-password\"\n" +
    "                         type=\"password\"\n" +
    "                         class=\"form-control input-lg\"\n" +
    "                         required />\n" +
    "               </div>\n" +
    "            </div>\n" +
    "\n" +
    "            <button ng-disabled=\"signupForm.$invalid\" class=\"btn btn-primary btn-xlarge\">\n" +
    "               Uncover my impact<i class=\"icon-arrow-right\"></i>\n" +
    "            </button>\n" +
    "         </form>\n" +
    "\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div class=\"signup-sidebar\">\n" +
    "      <div class=\"testimonials-container\">\n" +
    "         <div class=\"testimonial\">\n" +
    "            <img src=\"/static/img/people/luo.png\"/>\n" +
    "            <q class=\"text\">I don't need my CV now, Impactstory tells my story!</q>\n" +
    "            <cite>\n" +
    "               <span class=\"name\">Ruibang Luo,</span>\n" +
    "               <span class=\"inst\">Hong Kong University</span>\n" +
    "            </cite>\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("update/update-progress.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("update/update-progress.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h3 id=\"finding-impact-data-header\">Finding impact data</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body update\">\n" +
    "   <div class=\"intro\"><br>We're scouring the web to discover the impacts of all your research products...</div>\n" +
    "\n" +
    "   <div class=\"update-progress\">\n" +
    "      <div class=\"products not-done\">\n" +
    "         <div class=\"content\" ng-show=\"updateStatus.numNotDone\"></div>\n" +
    "            <span class=\"count still-working\">{{ updateStatus.numNotDone }}</span>\n" +
    "            <span class=\"descr\">products updating</span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "      <progress percent=\"updateStatus.percentComplete\" class=\"progress-striped active\"></progress>\n" +
    "\n" +
    "      <div class=\"products done\">\n" +
    "         <div class=\"content\" ng-show=\"updateStatus.numNotDone\"></div>\n" +
    "            <span class=\"count finished\">{{ updateStatus.numDone}}</span>\n" +
    "            <span class=\"descr\">products <br>done</span>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>");
}]);
