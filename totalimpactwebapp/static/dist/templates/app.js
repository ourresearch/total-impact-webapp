angular.module('templates.app', ['footer.tpl.html', 'header.tpl.html', 'importers/importer.tpl.html', 'infopages/about.tpl.html', 'infopages/collection.tpl.html', 'infopages/faq.tpl.html', 'infopages/landing.tpl.html', 'notifications.tpl.html', 'password-reset/password-reset-header.tpl.html', 'password-reset/password-reset.tpl.html', 'product/badges.tpl.html', 'product/biblio.tpl.html', 'product/metrics-table.tpl.html', 'profile-product/percentilesInfoModal.tpl.html', 'profile-product/profile-product-page.tpl.html', 'profile/profile-add-products.tpl.html', 'profile/profile.tpl.html', 'settings/custom-url-settings.tpl.html', 'settings/email-settings.tpl.html', 'settings/password-settings.tpl.html', 'settings/profile-settings.tpl.html', 'settings/settings.tpl.html', 'signup/signup-creating.tpl.html', 'signup/signup-header.tpl.html', 'signup/signup-name.tpl.html', 'signup/signup-password.tpl.html', 'signup/signup-products.tpl.html', 'signup/signup-url.tpl.html', 'signup/signup.tpl.html', 'update/update-progress.tpl.html']);

angular.module("footer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("footer.tpl.html",
    "<div id=\"footer\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <div id=\"footer-branding\" class=\"footer-col\">\n" +
    "         <a class=\"brand\" href=\"/\"><img src=\"/static/img/impactstory-logo.png\" alt=\"ImpactStory\" /></a>\n" +
    "\n" +
    "         <p>We're your impact profile on the web, revealing diverse impacts of your articles, datasets, software, and more.</p>\n" +
    "         <p class=\"license\">\n" +
    "            <!--<a rel=\"license\" href=\"http://creativecommons.org/licenses/by/2.0/\"><img alt=\"Creative Commons License\" style=\"border-width:0\" src=\"http://i.creativecommons.org/l/by/2.0/80x15.png\" /></a>-->\n" +
    "            <span class=\"text\">Except where otherwise noted, content on this site is licensed under the\n" +
    "               <a rel=\"license\" href=\"http://creativecommons.org/licenses/by/2.0/\">CC-BY license</a>.\n" +
    "            </span>\n" +
    "         </p>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div id=\"footer-follow\" class=\"footer-col\">\n" +
    "         <h3>Follow</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"http://twitter.com/#!/ImpactStory\">Twitter</a></li>\n" +
    "            <li><a href=\"http://twitter.com/#!/ImpactStory_now\">Site status</a></li>\n" +
    "            <li><a href=\"http://blog.impactstory.org\">Blog</a></li>\n" +
    "            <li><a href=\"https://groups.google.com/forum/?fromgroups#!forum/total-impact\">Newsgroup</a></li>\n" +
    "            <li><a href=\"https://github.com/total-impact\">GitHub</a></li>\n" +
    "\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "      <div id=\"footer-about\" class=\"footer-col\">\n" +
    "         <h3>About</h3>\n" +
    "         <ul>\n" +
    "            <li><a href=\"/about\">About us</a></li>\n" +
    "            <li><a href=\"http://feedback.impactstory.org\" target=\"_blank\">Feedback</a></li>\n" +
    "            <li>\n" +
    "               <a href=\"javascript:void(0)\" data-uv-lightbox=\"classic_widget\" data-uv-mode=\"full\" data-uv-primary-color=\"#cc6d00\" data-uv-link-color=\"#007dbf\" data-uv-default-mode=\"support\" data-uv-forum-id=\"166950\">Support</a>\n" +
    "            </li>\n" +
    "\n" +
    "\n" +
    "            <li><a href=\"/api-docs\">API/embed</a></li>\n" +
    "            <li><a href=\"/faq\">FAQ</a></li>\n" +
    "            <!--<li><a href=\"/about#contact\">Contact us</a></li>-->\n" +
    "            <li><a href=\"/faq#tos\">Terms of use</a></li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "      <div id=\"footer-funders\" class=\"footer-col\">\n" +
    "         <h3>Supported by</h3>\n" +
    "         <a href=\"http://sloan.org/\" id=\"footer-sloan-link\">\n" +
    "            <img src=\"/static/img/sloan-logo.png\"  width=\"200\"/>\n" +
    "         </a>\n" +
    "         <a href=\"http://nsf.gov\" id=\"footer-nsf-link\">\n" +
    "            <img src=\"/static/img/logos/nsf.png\"  width=\"200\"/>\n" +
    "         </a>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div> <!-- end footer -->\n" +
    "");
}]);

angular.module("header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("header.tpl.html",
    "<div class=\"main-header header\" ng-class=\"{big: page.isLandingPage()}\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <a class=\"brand\" href=\"/\">\n" +
    "         <img src=\"/static/img/impactstory-logo.png\" alt=\"ImpactStory\" />\n" +
    "      </a>\n" +
    "      <login-toolbar></login-toolbar>\n" +
    "   </div>\n" +
    "</div>\n" +
    "<div ng-show=\"page.showNotificationsIn('header')\" ng-include=\"'notifications.tpl.html'\" class=\"container-fluid\"></div>\n" +
    "");
}]);

angular.module("importers/importer.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("importers/importer.tpl.html",
    "\n" +
    "\n" +
    "<div class=\"importer-tile\"\n" +
    "     ng-click=\"showImporterWindow()\"\n" +
    "     ng-class=\"{'has-run': importerHasRun, 'not-run': !importerHasRun}\">\n" +
    "\n" +
    "   <div class=\"importer-name\"><img ng-src=\"{{ importer.logoPath }}\"></div>\n" +
    "   <div class=\"imported-products-count\">\n" +
    "      <span class=\"count\">{{ products.length }}</span>\n" +
    "      <span class=\"descr\">products imported</span>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"overlay\"\n" +
    "     ng-click=\"hideImportWindow()\"\n" +
    "     ng-if=\"importWindowOpen\"\n" +
    "     ng-animate=\"{enter: 'animated fadeIn', leave: 'animated fadeOut'}\"></div>\n" +
    "\n" +
    "<div class=\"import-window\"\n" +
    "     ng-if=\"importWindowOpen\"\n" +
    "     ng-animate=\"{enter: 'animated slideInRight', leave: 'animated slideOutRight'}\">\n" +
    "   <div class=\"content\">\n" +
    "      <h2 class=\"importer-name\" ng-show=\"!importer.url\"><img ng-src=\"{{ importer.logoPath }}\" /> </h2>\n" +
    "      <h2 class=\"importer-name\" ng-show=\"importer.url\">\n" +
    "         <a class=\"logo\" href=\"{{ importer.url }}\" target=\"_blank\"><img ng-src=\"{{ importer.logoPath }}\" /></a>\n" +
    "         <a class=\"visit\" href=\"{{ importer.url }}\" target=\"_blank\">Visit<i class=\"icon-chevron-right\"></i></a>\n" +
    "      </h2>\n" +
    "\n" +
    "      <div class=\"descr\">{{ importer.descr }}</div>\n" +
    "\n" +
    "      <form name=\"{{ importer.name }}ImporterForm\" novalidate class=\"form\" ng-submit=\"onImport()\">\n" +
    "\n" +
    "         <div class=\"form-group\" ng-repeat=\"input in importer.inputs\">\n" +
    "            <label class=\"control-label\">\n" +
    "               {{ input.displayName }} {{ input.inputNeeded }}\n" +
    "               <i class=\"icon-question-sign\" ng-show=\"input.help\" tooltip-html-unsafe=\"{{ input.help }}\"></i>\n" +
    "               <span class=\"one-per-line\" ng-show=\"input.inputType=='idList'\">(one per line)</span>\n" +
    "            </label>\n" +
    "            <div class=\"importer-input\" ng-switch on=\"input.inputType\">\n" +
    "               <input\n" +
    "                       class=\"form-control\"\n" +
    "                       ng-model=\"userInput[input.name]\"\n" +
    "                       type=\"text\" ng-switch-when=\"username\"\n" +
    "                       placeholder=\"{{ input.placeholder }}\">\n" +
    "               <textarea placeholder=\"{{ input.placeholder }}\"\n" +
    "                         class=\"form-control\"\n" +
    "                         ng-model=\"userInput[input.name]\"\n" +
    "                         ng-switch-when=\"idList\"></textarea>\n" +
    "               <!-- you can only have ONE file input per importer, otherwise namespace collision -->\n" +
    "               <input type=\"file\" ng-switch-when=\"file\" size=\"300\" ng-file-select=\"input.inputType\">\n" +
    "\n" +
    "            </div>\n" +
    "         </div>\n" +
    "\n" +
    "\n" +
    "         <save-buttons action=\"Import\"></save-buttons>\n" +
    "\n" +
    "\n" +
    "      </form>\n" +
    "\n" +
    "      <div class=\"extra\" ng-show=\"importer.extra\" ng-bind-html-unsafe=\"importer.extra\"></div>\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
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
    "      <p>ImpactStory is an open-source, web-based tool that helps researchers explore and share the diverse impacts of all their research products&mdash;from traditional ones like journal articles, to emerging products like blog posts, datasets, and software. By helping researchers tell data-driven stories about their impacts, we're helping to build a new scholarly reward system that values and encourages web-native scholarship. We’re funded by the Alfred P. Sloan Foundation and incorporated as a nonprofit corporation.\n" +
    "\n" +
    "      <p>ImpactStory delivers <em>open metrics</em>, with <em>context</em>, for <em>diverse products</em>:</p>\n" +
    "      <ul>\n" +
    "         <li><b>Open metrics</b>: Our <a href=\"http://impactstory.org/api-docs\">data</a> (to the extent allowed by providers’ terms of service), <a href=\"https://github.com/total-impact\">code</a>, and <a href=\"http://blog.impactstory.org/2012/03/01/18535014681/\">governance</a> are all open.</li>\n" +
    "         <li><b>With context</b>: To help researcher move from raw <a href=\"http://altmetrics.org/manifesto/\">altmetrics</a> data to <a href=\"http://asis.org/Bulletin/Apr-13/AprMay13_Piwowar_Priem.html\">impact profiles</a> that tell data-driven stories, we sort metrics by <em>engagement type</em> and <em>audience</em>. We also normalize based on comparison sets: an evaluator may not know if 5 forks on GitHub is a lot of attention, but they can understand immediately if their project ranked in the 95th percentile of all GitHub repos created that year.</li>\n" +
    "         <li><b>Diverse products</b>: Datasets, software, slides, and other research products are presented as an integrated section of a comprehensive impact report, alongside articles&mdash;each genre a first-class citizen, each making its own kind of impact.</li>\n" +
    "      </ul>\n" +
    "\n" +
    "      <h3 id=\"team\">team</h3>\n" +
    "      <div class=\"team-member first\">\n" +
    "         <img src=\"/static/img/hat.jpg\" height=100/>\n" +
    "         <p><strong>Jason Priem</strong> is a cofounder of ImpactStory and a doctoral student in information science at the University of North Carolina-Chapel Hill. Since <a href=\"https://twitter.com/jasonpriem/status/25844968813\">coining the term \"altmetrics,\"</a> he's remained active in the field, organizing the annual <a href=\"http:altmetrics.org/altmetrics12\">altmetrics workshops</a>, giving <a href=\"http://jasonpriem.org/cv/#invited\">invited talks</a>, and publishing <a href=\"http://jasonpriem.org/cv/#refereed\">peer-reviewed altmetrics research.</a></p>\n" +
    "\n" +
    "         <p>Jason has contributed to and created several open-source software projects, including <a href=\"http://www.zotero.org\">Zotero</a> and <a href=\"http://feedvis.com\">Feedvis</a>, and has experience and training in art, design, and information visualisation.  Sometimes he writes on a <a href=\"http://jasonpriem.org/blog\">blog</a> and <a href=\"https://twitter.com/#!/jasonpriem\">tweets</a>.</p>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"team-member second\">\n" +
    "         <img src=\"/static/img/heather.jpg\" height=100/>\n" +
    "         <p><strong>Heather Piwowar</strong> is a cofounder of ImpactStory and a leading researcher in the area of research data availability and data reuse. She wrote one of the first papers to measure the <a href=\"http://www.plosone.org/article/info:doi/10.1371/journal.pone.0000308\">citation benefit of publicly available research data</a> and has studied  <a href=\"http://www.plosone.org/article/info:doi/10.1371/journal.pone.0018657\">patterns in public deposition of datasets</a>, <a href=\"https://peerj.com/preprints/1/\">patterns of data reuse</a>, and the <a href=\"http://researchremix.wordpress.com/2010/10/12/journalpolicyproposal\">impact of journal data sharing policies</a>.</p>\n" +
    "\n" +
    "         <p>Heather has a bachelor’s and master’s degree from MIT in electrical engineering, 10 years of experience as a software engineer in small companies, and a Ph.D. in Biomedical Informatics from the University of Pittsburgh.  She is an <a href=\"http://www.slideshare.net/hpiwowar\">frequent speaker</a> on research data archiving, writes a well-respected <a href=\"http://researchremix.wordpress.com\">research blog</a>, and is active on twitter (<a href=\"http://twitter.com/researchremix\">@researchremix</a>). </p>\n" +
    "      </div>\n" +
    "      <div class=\"clearfix\"></div>\n" +
    "\n" +
    "\n" +
    "      <h3 id=\"history\">history</h3>\n" +
    "      <p>ImpactStory began life as total-impact, a hackathon project at the Beyond Impact workshop in 2011. As the hackathon ended, a few of us migrated into a hotel hallway to continue working, eventually completing a 24-hour coding marathon to finish a prototype. Months of spare-time development followed, then funding.  We’ve got the same excitement for ImpactStory today.</p>\n" +
    "\n" +
    "      <p>In early 2012, ImpactStory was given £17,000 through the <a href=\"http://www.beyond-impact.org/\">Beyond Impact project</a> from the <a href=\"http://www.soros.org/\">Open Society Foundation</a>.  Today ImpactStory is funded by the <a href=\"http://sloan.org/\">Alfred P. Sloan Foundation</a>, first through <a href=\"http://blog.impactstory.org/2012/03/29/20131290500/\">a $125,000 grant</a> in mid 2012 and then <a href=\"http://blog.impactstory.org/2013/06/17/sloan/\">a two-year grant for $500,000</a> starting in 2013.</p>\n" +
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
    "         <p>We'd love to hear your feedback, ideas, or just chat! Reach us at <a href=\"mailto:team@impactstory.org\">team@impactstory.org</a>, on <a href=\"http://twitter.com/#!/ImpactStory\">Twitter</a>, or via our <a href=\"http://feedback.impactstory.org\">help forum.</a> Or if you've got questions, check out our <a href=\"/faq\">FAQ</a>.</p>\n" +
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
    "   <h3 id=\"what\" class=\"first\">what is ImpactStory?</h3>\n" +
    "\n" +
    "   <p>ImpactStory is an open-source, web-based tool that helps researchers explore and share the diverse impacts of all their research products&mdash;from traditional ones like journal articles, to emerging products like blog posts, datasets, and software. By helping researchers tell data-driven stories about their impacts, we're helping to build a new scholarly reward system that values and encourages web-native scholarship. We’re funded by the Alfred P. Sloan Foundation and incorporated as a nonprofit corporation.\n" +
    "\n" +
    "   <p>ImpactStory delivers <em>open metrics</em>, with <em>context</em>, for <em>diverse products</em>:</p>\n" +
    "   <ul>\n" +
    "      <li><b>Open metrics</b>: Our <a href=\"http://impactstory.org/api-docs\">data</a> (to the extent allowed by providers’ terms of service), <a href=\"https://github.com/total-impact\">code</a>, and <a href=\"http://blog.impactstory.org/2012/03/01/18535014681/\">governance</a> are all open.</li>\n" +
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
    "   <p>ImpactStory data can be:</p>\n" +
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
    "   <p>Some of these issues relate to the early-development phase of ImpactStory, some reflect our <a href=\"http://www.mendeley.com/groups/586171/altmetrics/papers/\">early-understanding of altmetrics</a>, and some are just common sense.  ImpactStory reports shouldn't be used:\n" +
    "\n" +
    "   <ul>\n" +
    "      <li><b>as indication of comprehensive impact</b>\n" +
    "         <p>ImpactStory is in early development. See <a href=\"#limitations\">limitations</a> and take it all with a grain of salt.\n" +
    "\n" +
    "            <li><b>for serious comparison</b>\n" +
    "               <p>ImpactStory is currently better at collecting comprehensive metrics for some products than others, in ways that are not clear in the report. Extreme care should be taken in comparisons. Numbers should be considered minimums. Even more care should be taken in comparing collections of products, since some ImpactStory is currently better at identifying products identified in some ways than others. Finally, some of these metrics can be easily gamed. This is one reason we believe having many metrics is valuable.\n" +
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
    "   <p>The short answer is: probably something useful, but we’re not sure what. We believe that dismissing the metrics as “buzz” is short-sited: surely people bookmark and download things for a reason. The long answer, as well as a lot more speculation on the long-term significance of tools like ImpactStory, can be found in the nascent scholarly literature on “altmetrics.”\n" +
    "\n" +
    "   <p><a href=\"http://altmetrics.org/manifesto/\">The Altmetrics Manifesto</a> is a good, easily-readable introduction to this literature. You can check out the shared <a href=\"http://www.mendeley.com/groups/586171/altmetrics/papers/\">altmetrics library</a> on Mendeley for a growing list of relevant research.\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"whichartifacts\">which identifiers are supported?</h3>\n" +
    "   <table class=\"permitted-artifact-ids\" border=1>\n" +
    "           <tr><th>artifact type</th><th>host</th><th>supported<br>ID format</th><th>example (id-type:id)</th><tr>\n" +
    "           <tr><td>published article</td><td>an article with a DOI</td><td>DOI</td><td><b>doi:</b>10.1371/journal.pcbi.1000361</td></tr>\n" +
    "           <tr><td>published article</td><td>an article in PubMed</td><td>PMID</td><td><b>pmid:</b>19304878</td></tr>\n" +
    "           <tr><td>dataset</td><td>Dryad or figshare</td><td>DOI</td><td><b>doi:</b>10.5061/dryad.1295</td></tr>\n" +
    "           <tr><td>software</td><td>GitHub</td><td>URL</td><td><b>url:</b>https://github.com/egonw/biostar-central</td></tr>\n" +
    "           <tr><td>slides</td><td>SlideShare</td><td>URL</td><td><b>url:</b>http://www.slideshare.net/phylogenomics/eisenall-hands</td></tr>\n" +
    "           <tr><td>generic</td><td>A conference paper, website resource, etc.</td><td>URL</td><td><b>url:</b>http://opensciencesummit.com/program/</td></tr>\n" +
    "   </table>\n" +
    "\n" +
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
    "   <p>We do not include the Journal Impact Factor (or any similar proxy) on purpose. As has been <a href=\"https://www.zotero.org/groups/impact_factor_problems/items\">repeatedly shown</a>, the Impact Factor is not appropriate for judging the quality of individual research products. Individual article citations reflect much more about how useful papers actually were. Better yet are article-level metrics, as initiated by PLoS, in which we examine traces of impact beyond citation. ImpactStory broadens this approach to reflect <b>product-level metrics</b>, by inclusion of preprints, datasets, presentation slides, and other research output formats.\n" +
    "\n" +
    "   <h3 id=\"similar\">where is my other favourite metric?</h3>\n" +
    "\n" +
    "   <p>We only include open metrics here, and so far only a selection of those. We welcome contributions of plugins. Write your own and tell us about it.\n" +
    "\n" +
    "   <p>Not sure ImpactStory is your cup of tea?  Check out these similar tools:\n" +
    "   <ul>\n" +
    "      <li><a href=\"http://altmetric.com\">altmetric.com</a>\n" +
    "      <li><a href=\"http://www.plumanalytics.com/\">Plum Analytics</a>\n" +
    "      <li><a href=\"http://code.google.com/p/alt-metrics/\">PLoS Article-Level Metrics application</a>\n" +
    "      <li><a href=\"http://sciencecard.org/\">Science Card</a>\n" +
    "      <li><a href=\"http://citedin.org/\">CitedIn</a>\n" +
    "      <li><a href=\"http://readermeter.org/\">ReaderMeter</a>\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"you-are-not-geting-all-my-citations\">you're not getting all my citations!</h3>\n" +
    "   <p>We'd love to display citation information from Google Scholar and Thomson Reuter's Web of Science in ImpactStory, but sadly neither Google Scholar nor Web of Science allow us to do this. We're really pleased that Scopus has been more open with their data, allowing us to display their citation data on our website.  PubMed and Crossref are exemplars of open data: we display their citation counts on our website, in ImpactStory widgets, and through our API.  As more citation databases open up, we'll include their data as fully as we can.</p>\n" +
    "\n" +
    "   <p>Each source of citation data gathers citations in its own ways, with their own strengths and limitations.  Web of Science gets  citation counts by manually gathering citations from a relatively small set of \"core\" journals.  Scopus and Google Scholar crawl a much more expansive set of publisher webpages, and Google also examines papers hosted elsewhere on the web.  PubMed looks at the reference sections of papers in PubMed Central, and CrossRef by looking at the reference lists that they see.  Google Scholar's scraping techniques and citation criteria are the most inclusive; the number of citations found by Google Scholar is typically the highest, though the least curated. A lot of folks have looked into the differences between citation counts from different providers, comparing Google Scholar, Scopus, and Web of Science and finding many differences; if you'd like to learn more, you might start with <a href=\"http://eprints.rclis.org/8605/\">this article.</a></p>\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"limitations\">what are the current limitations of the system?</h3>\n" +
    "\n" +
    "   <p>ImpactStory is in early development and has many limitations. Some of the ones we know about:\n" +
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
    "      <li>some sources have multiple records for a given product. ImpactStory only identifies one copy and so only reports the impact metrics for that record. It makes no current attempt to aggregate across duplications within a source.\n" +
    "   </ul>\n" +
    "\n" +
    "   <h4>other</h4>\n" +
    "   <ul>\n" +
    "      <li>the number of items on a report is currently limited.\n" +
    "   </ul>\n" +
    "\n" +
    "   Tell us about bugs! <a href=\"http://twitter.com/#!/ImpactStory\">@ImpactStory</a> (or via email to team@impactstory.org)\n" +
    "\n" +
    "   <h3 id=\"isitopen\">is this data Open?</h3>\n" +
    "\n" +
    "   <p>We’d like to make all of the data displayed by ImpactStory available under CC0. Unfortunately, the terms-of-use of most of the data sources don’t allow that. We're trying to figure out how to handle this.\n" +
    "   <p>An option to restrict the displayed reports to Fully Open metrics — those suitable for commercial use — is on the To Do list.\n" +
    "   <p>The ImpactStory software itself is fully open source under an MIT license. <a href=\"https://github.com/total-impact\">GitHub</a>\n" +
    "\n" +
    "   <h3 id=\"api\">does ImpactStory have an api?</h3>\n" +
    "\n" +
    "   <p>yes! ImpactStory is built on its own api, and others may build on it too.\n" +
    "   <p>We also have javascript to make embedding ImpactStory data very easy.  We'll document it soon: contact us for details in the meantime.\n" +
    "\n" +
    "\n" +
    "   <h3 id=\"who\">who developed ImpactStory?</h3>\n" +
    "\n" +
    "   <p>Concept originally hacked at the <a href=\"http://www.beyond-impact.org/\">Beyond Impact Workshop</a>, part of the Beyond Impact project funded by the Open Society Foundations <a href=\"https://github.com/mhahnel/Total-Impact/contributors\">(initial contributors)</a>.  Here's the <a href=\"/about\">current team</a>.\n" +
    "\n" +
    "   <h3 id=\"funding\">who funds ImpactStory?</h3>\n" +
    "\n" +
    "   <p>Early development was done on personal time, plus some discretionary time while funded through <a href=\"http://dataone.org\">DataONE</a> (Heather Piwowar) and a <a href=\"http://gradschool.unc.edu/programs/royster\">UNC Royster Fellowship</a> (Jason Priem).\n" +
    "\n" +
    "   <p>In early 2012, ImpactStory was given £17,000 through the <a href=\"http://www.beyond-impact.org/\">Beyond Impact project</a> from the <a href=\"http://www.soros.org/\">Open Society Foundation</a>.  As of May 2012, ImpactStory is funded through a $125k grant from the <a href=\"http://sloan.org/\">Alfred P. Sloan Foundation. </a>\n" +
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
    "      <li><b>do you have ideas?</b> Maybe enhancements to ImpactStory would fit in with a grant you are writing, or maybe you want to make it work extra-well for your institution’s research outputs. We’re interested: please get in touch (see bottom).\n" +
    "      <li><b>do you have energy?</b> We need better “see what it does” documentation, better lists of collections, etc. Make some and tell us, please!\n" +
    "      <li><b>do you have anger that your favourite data source is missing?</b> After you confirm that its data isn't available for open purposes like this, write to them and ask them to open it up... it might work. If the data is open but isn't included here, let us know to help us prioritize.\n" +
    "      <li><b>can you email, blog, post, tweet, or walk down the hall to tell a friend?</b> See the <a href=\"#cool\">this is so cool</a> section for your vital role....\n" +
    "   </ul>\n" +
    "\n" +
    "   <h3 id=\"cool\">this is so cool.</h3>\n" +
    "\n" +
    "   <p>Thanks! We agree :)\n" +
    "   <p>You can help us.  Demonstrating the value of ImpactStory is key to receiving future funding.\n" +
    "   <p>Buzz and testimonials will help. Tweet your reports. Blog, send email, and show off ImpactStory at your next group meeting to help spread the word.\n" +
    "   <p>Tell us how cool it is at <a href=\"http://twitter.com/#!/ImpactStory\">@ImpactStory</a> (or via email to team@impactstory.org) so we can consolidate the feedback.\n" +
    "\n" +
    "   <h3 id=\"suggestion\">I have a suggestion!</h3>\n" +
    "\n" +
    "   <p><b>We want to hear it.</b> Send it to us at <a href=\"http://twitter.com/#!/ImpactStory\">@ImpactStory</a> (or via email to team@impactstory.org).\n" +
    "\n" +
    "   <h3 id=\"tos\">terms of use</h3>\n" +
    "   <p>Due to agreements we have made with data providers, you may not scrape this website.  Use our <a href=\"/api-docs\">JavaScript widget or API</a> instead.</p>\n" +
    "\n" +
    "\n" +
    "</div><!-- end wrapper -->\n" +
    "</div><!-- end faq -->\n" +
    "</div>");
}]);

angular.module("infopages/landing.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("infopages/landing.tpl.html",
    "<div class=\"main infopage landing\">\n" +
    "   <div id=\"tagline\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <h1>Share the full story of your <br>research impact.</h1>\n" +
    "         <p class=\"subtagline\">ImpactStory is your impact profile on the web: we reveal the diverse impacts of your articles, datasets, software, and more.</p>\n" +
    "         <div id=\"call-to-action\">\n" +
    "            <a href=\"/signup\" class=\"btn btn-large btn-primary primary-action\" id=\"create-collection\">Make my impact profile</a>\n" +
    "            <a href=\"/CarlBoettiger\" class=\"btn btn-large btn-primary secondary-action\" id=\"view-sample-collection\">View a sample profile</a>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div id=\"selling-points\">\n" +
    "      <ul class=\"wrapper\" >\n" +
    "         <li>\n" +
    "            <h3 id=\"metrics-in-seconds\"><i class=\"icon-time icon-2x\"></i><span class=\"text\">View metrics in seconds</span></h3>\n" +
    "            <p>Point us to your slides, code, datasets, and articles. In a few seconds, you'll have a report detailing your impacts: citations, bookmarks, downloads, tweets, and more.</p>\n" +
    "         </li>\n" +
    "         <li class=\"middle\">\n" +
    "            <h3 id=\"embed-metrics-anywhere\"><i class=\"icon-suitcase icon-2x\"></i><span class=\"text\">Embed them anywhere</span></h3>\n" +
    "            <p>Drop ImpactStory's embeddable <a href=\"/api-docs\">Javascript widget</a> into your own online CV or website to show the impacts of your projects.</p>\n" +
    "         </li>\n" +
    "         <li>\n" +
    "            <h3 id=\"its-open\"><i class=\"icon-wrench icon-2x\"></i><span class=\"text\">Open data,<br> open source.</span></h3>\n" +
    "            <p>Our data, like our <a href=\"http://github.com/total-impact\">source code</a>, is wide open.  As a non-profit, we're built around supporting open tools to nurture Web-native scholarship.</p>\n" +
    "         </li>\n" +
    "      </ul>\n" +
    "   </div>\n" +
    "\n" +
    "\n" +
    "   <div id=\"sources\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <h2>Uncover your impacts from all across the Web: </h2>\n" +
    "         <ul id=\"source-logos\">\n" +
    "            <li><img src=\"/static/img/logos/citeulike.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/crossref.jpg\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/delicious.jpg\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/dryad.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/f1000.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/figshare.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/github.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/mendeley.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/orcid.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/plos.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/pmc.gif\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/pubmed.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/scienceseeker.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/scopus.jpg\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/slideshare.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/twitter.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/vimeo.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/wikipedia.png\" /></li>\n" +
    "            <li><img src=\"/static/img/logos/youtube.png\" /></li>\n" +
    "         </ul>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("notifications.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("notifications.tpl.html",
    "<ul class=\"notifications\">\n" +
    "   <li ng-class=\"['alert', 'alert-'+notification.type]\"\n" +
    "       ng-repeat=\"notification in notifications.getCurrent()\">\n" +
    "\n" +
    "       <button class=\"close\" ng-click=\"removeNotification(notification)\">&times;</button>\n" +
    "       {{notification.message}}\n" +
    "   </li>\n" +
    "</ul>\n" +
    "");
}]);

angular.module("password-reset/password-reset-header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("password-reset/password-reset-header.tpl.html",
    "<div class=\"password-reset-header\">\n" +
    "   <h1><a class=\"brand\" href=\"/\">\n" +
    "      <img src=\"/static/img/impactstory-logo-white.png\" alt=\"ImpactStory\" /></a>\n" +
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

angular.module("product/badges.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product/badges.tpl.html",
    "<ul class=\"ti-badges\">\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "   <li ng-repeat=\"award in awards | orderBy:['!isHighly', 'displayOrder']\" class=\"award\">\n" +
    "\n" +
    "      <a href=\"{{ getProductPageUrl() }}\"\n" +
    "            class=\"ti-badge lil-badge {{award.audience}} {{award.engagementType}}\"\n" +
    "            ng-show=\"!award.isHighly\"\n" +
    "            popover-trigger=\"mouseenter\"\n" +
    "            popover-placement=\"bottom\"\n" +
    "            popover-title=\"{{award.engagementType}} by {{award.displayAudience}}\"\n" +
    "            popover=\"This item has {{award.topMetric.actualCount}} {{award.topMetric.environment}}\n" +
    "            {{award.topMetric.displayInteraction}}, suggesting it's been\n" +
    "            {{award.engagementType}} by {{award.displayAudience}}.\n" +
    "            Click to learn more.\">\n" +
    "         <span class=\"engagement-type\">{{award.engagementType}}</span>\n" +
    "         <span class=\"audience\">by {{award.audience}}</span>\n" +
    "       </a>\n" +
    "\n" +
    "      <a href=\"{{ getProductPageUrl() }}\"\n" +
    "            class=\"ti-badge big-badge {{award.audience}} {{award.engagementType}}\"\n" +
    "            ng-show=\"award.isHighly\"\n" +
    "            popover-trigger=\"mouseenter\"\n" +
    "            popover-placement=\"bottom\"\n" +
    "            popover-title=\"Highly {{award.engagementType}} by {{award.displayAudience}}\"\n" +
    "            popover=\"This item has {{award.topMetric.actualCount}} {{award.topMetric.environment}}\n" +
    "            {{award.topMetric.displayInteraction}}. That's better than\n" +
    "            {{award.topMetric.percentiles.CI95_lower}}% of items\n" +
    "            {{award.topMetric.referenceSetStorageVerb}} {{award.topMetric.refSet}} in {{award.topMetric.referenceSetYear}},\n" +
    "            suggesting it's highly {{award.engagementType}} by {{award.displayAudience }}.\n" +
    "            Click to learn more.\">\n" +
    "\n" +
    "         <span class=\"modifier\">highly</span>\n" +
    "         <span class=\"engagement-type\">{{award.engagementType}}</span>\n" +
    "         <span class=\"audience\">by {{award.audience}}</span>\n" +
    "      </a>\n" +
    "\n" +
    "      <span class=\"metrics\">\n" +
    "         <img ng-repeat=\"metric in award.metrics\" ng-src=\"{{ metric.static_meta.icon }}\">\n" +
    "      </span>\n" +
    "\n" +
    "   </li>\n" +
    "</ul>");
}]);

angular.module("product/biblio.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("product/biblio.tpl.html",
    "<h5 class=\"title\" xmlns=\"http://www.w3.org/1999/html\">\n" +
    "   <a class=\"title-text\" href=\"{{ getProductPageUrl() }}\">{{biblio.title}}</a>\n" +
    "   <a ng-if=\"biblio.url\" class=\"linkout url title\" target=\"_blank\" href=\"{{ biblio.url }}\">\n" +
    "      <i class=\"icon-external-link-sign\"></i>\n" +
    "   </a>\n" +
    "</h5>\n" +
    "<div class=\"optional-biblio\">\n" +
    "   <span ng-if=\"biblio.year\" class=\"year\">({{ biblio.year }})</span>\n" +
    "   <span ng-if=\"biblio.authors\" class=\"authors\">{{ biblio.authors }}.</span>\n" +
    "   <span ng-if=\"biblio.repository\" class=\"repository\">{{ biblio.repository }}.</span>\n" +
    "   <span ng-if=\"biblio.journal\" class=\"repository\">{{ biblio.journal }}</span>\n" +
    "   <span ng-if=\"biblio.description\" class=\"repository\">{{ biblio.description }}</span>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "</div>\n" +
    "");
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

angular.module("profile-product/percentilesInfoModal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile-product/percentilesInfoModal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <button type=\"button\" class=\"close\" ng-click=\"$close()\">&times;</button>\n" +
    "   <h3>What do these numbers mean?</h3>\n" +
    "</div>\n" +
    "<div class=\"modal-body\">\n" +
    "   <p>ImpactStory classifies metrics along two dimensions: <strong>audience</strong> (<em>scholars</em> or the <em>public</em>) and <strong>type of engagement</strong> with research (<em>view</em>, <em>discuss</em>, <em>save</em>, <em>cite</em>, and <em>recommend</em>).</p>\n" +
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
    "         <a class=\"delete-product\"\n" +
    "            ng-click=\"deleteProduct()\"\n" +
    "            ng-show=\"userOwnsThisProfile\"\n" +
    "            tooltip=\"Remove this product from your profile.\"\n" +
    "            tooltip-placement=\"bottom\">\n" +
    "            <i class=\"icon-trash\"></i>\n" +
    "            Delete product\n" +
    "         </a>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "   <div class=\"product\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <div class=\"working\" ng-show=\"loading.is()\">\n" +
    "            <i class=\"icon-refresh icon-spin\"></i>\n" +
    "            <span class=\"text\">Loading product...</span>\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"biblio\" ng-include=\"'product/biblio.tpl.html'\"></div>\n" +
    "         <div class=\"metric-details\" ng-include=\"'product/metrics-table.tpl.html'\"></div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>");
}]);

angular.module("profile/profile-add-products.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("profile/profile-add-products.tpl.html",
    "<div class=\"profile-add-products profile-subpage\" >\n" +
    "   <div class=\"add-products-header profile-subpage-header\">\n" +
    "      <div class=\"wrapper\">\n" +
    "         <a back-to-profile></a>\n" +
    "         <h2 class=\"instr\">Select a source to import from</h2>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"importers\" ng-controller=\"addProductsCtrl\">\n" +
    "      <div class=\"importer\"\n" +
    "           ng-repeat=\"importer in importers\"\n" +
    "           ng-controller=\"importerCtrl\"\n" +
    "           ng-include=\"'importers/importer.tpl.html'\">\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
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
    "         <h2 class='page-title editable-name'>\n" +
    "            <span class=\"given-name editable\" data-name=\"given_name\">{{ user.about.given_name }}</span>\n" +
    "            <span class=\"surname editable\" data-name=\"surname\">{{ user.about.surname }}</span>\n" +
    "         </h2>\n" +
    "         <div class=\"external-usernames\">\n" +
    "            <ul>\n" +
    "               <li ng-show=\"user.about.twitter_account_id\">\n" +
    "                  <a href=\"https://twitter.com/{{ user.about.twitter_account_id }}\">\n" +
    "                     <img src=\"https://twitter.com/favicon.ico\" />\n" +
    "                     <span class=\"service\">Twitter</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "               <li ng-show=\"user.about.github_id\">\n" +
    "                  <a href=\"https://github.com/{{ user.about.github_id }}\">\n" +
    "                     <img src=\"https://github.com/fluidicon.png\" />\n" +
    "                     <span class=\"service\">GitHub</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "               <li ng-show=\"user.about.orcid_id\">\n" +
    "                  <a href=\"https://orcid.org/{{ user.about.orcid_id }}\">\n" +
    "                     <img src=\"http://orcid.org/sites/about.orcid.org/files/orcid_16x16.ico\" />\n" +
    "                     <span class=\"service\">ORCID</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "               <li ng-show=\"user.about.slideshare_id\">\n" +
    "                  <a href=\"https://www.slideshare.net/{{ user.about.slideshare_id }}\">\n" +
    "                     <img src=\"http://www.slideshare.net/favicon.ico\" />\n" +
    "                     <span class=\"service\">Slideshare</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "               <li ng-show=\"user.about.figshare_id\">\n" +
    "                  <a href=\"{{ user.about.figshare_id }}\">\n" +
    "                     <img src=\"http://figshare.com/static/img/favicon.png\" />\n" +
    "                     <span class=\"service\">figshare</span>\n" +
    "                  </a>\n" +
    "               </li>\n" +
    "            </ul>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"my-metrics\"></div> <!-- profile-level stats go here -->\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"product-controls\" ng-show=\"userExists\">\n" +
    "   <div class=\"wrapper\">\n" +
    "      <div class=\"edit-controls btn-group\">\n" +
    "         <div class=\"num-items\">\n" +
    "            <span ng-hide=\"loadingProducts()\" class=\"val-plus-text\">\n" +
    "               <span class=\"value\">{{ filterProducts(products).length }}</span> research products\n" +
    "            </span>\n" +
    "            <a ng-click=\"showProductsWithoutMetrics = !showProductsWithoutMetrics\" ng-show=\"showProductsWithoutMetrics\">\n" +
    "               (hide <span class=\"value\">{{ filterProducts(products, \"withoutMetrics\").length }}</span> without metrics)\n" +
    "            </a>\n" +
    "         </div>\n" +
    "         <a href=\"/{{ user.about.url_slug }}/products/add\"><i class=\"icon-edit\"></i>Import products</a>\n" +
    "      </div>\n" +
    "      <div class=\"view-controls\">\n" +
    "         <!--<a><i class=\"icon-refresh\"></i>Refresh metrics</a>-->\n" +
    "         <span class=\"dropdown download\">\n" +
    "            <a id=\"adminmenu\" role=\"button\" class=\"dropdown-toggle\"><i class=\"icon-download\"></i>Download</a>\n" +
    "            <ul class=\"dropdown-menu\" role=\"menu\" aria-labelledby=\"adminmenu\">\n" +
    "               <li><a tabindex=\"-1\" href=\"http://impactstory.org/user/{{ user.about.id }}/products.csv\"><i class=\"icon-table\"></i>csv</a></li>\n" +
    "               <li><a tabindex=\"-1\" href=\"http://impactstory.org/user/{{ user.about.id }}/products\"><i class=\"json\">{&hellip;}</i>json</a></li>\n" +
    "            </ul>\n" +
    "         </span>\n" +
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
    "         <li class=\"product\"\n" +
    "             ng-repeat=\"product in products | orderBy:[getGenre, 'isHeading', getSortScore]\"\n" +
    "             ng-controller=\"productCtrl\"\n" +
    "             ng-show=\"hasMetrics() || showProductsWithoutMetrics || product.isHeading\"\n" +
    "             id=\"{{ product._id }}\">\n" +
    "\n" +
    "            <h2 class=\"product-heading {{ product.headingDimension }} {{ product.headingValue }}\"\n" +
    "                ng-show=\"product.isHeading\">\n" +
    "               <i class=\"icon-save software\"></i>\n" +
    "               <i class=\"icon-file-text-alt article\"></i>\n" +
    "               <i class=\"icon-table dataset\"></i>\n" +
    "               <i class=\"icon-desktop slides\"></i>\n" +
    "               <i class=\"icon-globe webpage\"></i>\n" +
    "               <i class=\"icon-facetime-video video\"></i>\n" +
    "               {{ product.headingValue }}\n" +
    "            </h2>\n" +
    "            <div class=\"real-product\" ng-show=\"!product.isHeading\">\n" +
    "               <div class=\"biblio\" ng-include=\"'product/biblio.tpl.html'\"></div>\n" +
    "               <div class=\"badges\" ng-include=\"'product/badges.tpl.html'\"></div>\n" +
    "            </div>\n" +
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
    "</div>");
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
    "      <div class=\"controls input-group col-lg-7\">\n" +
    "         <span class=\"input-group-addon\">http://impactstory.org/</span>\n" +
    "         <input ng-model=\"user.url_slug\"\n" +
    "                name=\"url_slug\"\n" +
    "                class=\"form-control\"\n" +
    "                required\n" +
    "                data-require-unique\n" +
    "                ng-pattern=\"/^\\w+$/\"\n" +
    "                 />\n" +
    "\n" +
    "      </div>\n" +
    "\n" +
    "      <spinner msg=\"Checking\"></spinner>\n" +
    "\n" +
    "      <div class=\"help-block error\"\n" +
    "            ng-show=\"userUrlForm.url_slug.$error.pattern\n" +
    "            && userUrlForm.url_slug.$dirty\n" +
    "            && !loading.is()\">\n" +
    "         This URL has invalid characters.\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"help-block error\"\n" +
    "            ng-show=\"userUrlForm.url_slug.$error.requireUnique\n" +
    "            && userUrlForm.url_slug.$dirty\n" +
    "            && !loading.is()\">\n" +
    "         Someone else is using that URL.\n" +
    "      </div>\n" +
    "      <div class=\"help-block success\"\n" +
    "            ng-show=\"userUrlForm.url_slug.$valid\n" +
    "            && userUrlForm.url_slug.$dirty\n" +
    "            && !loading.is()\">\n" +
    "         Looks good!\n" +
    "      </div>\n" +
    "      <div class=\"help-block\"\n" +
    "            ng-show=\"userUrlForm.url_slug.$pristine\n" +
    "            && !loading.is()\">\n" +
    "         This is your current URL.\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-lg-10\">\n" +
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
    "    <div class=\"controls input-group col-lg-7\">\n" +
    "      <span class=\"input-group-addon\"><i class=\"icon-envelope-alt\"></i></span>\n" +
    "      <input ng-model=\"user.email\"\n" +
    "      name=\"email\"\n" +
    "      class=\"form-control\"\n" +
    "      required\n" +
    "      data-require-unique\n" +
    "      />\n" +
    "\n" +
    "    </div>\n" +
    "\n" +
    "    <spinner msg=\"Checking\"></spinner>\n" +
    "\n" +
    "    <div class=\"help-block error\"\n" +
    "    ng-show=\"userEmailForm.email.$error.requireUnique\n" +
    "            && userEmailForm.email.$dirty\n" +
    "            && !loading.is()\">\n" +
    "    That email address is already in use.\n" +
    "    </div>\n" +
    "    <div class=\"help-block success\"\n" +
    "    ng-show=\"userEmailForm.email.$valid\n" +
    "            && userEmailForm.email.$dirty\n" +
    "            && !loading.is()\">\n" +
    "    Looks good!\n" +
    "    </div>\n" +
    "    <div class=\"help-block\"\n" +
    "    ng-show=\"userEmailForm.email.$pristine\n" +
    "            && !loading.is()\">\n" +
    "    This is your currently registered email.\n" +
    "    </div>\n" +
    "\n" +
    "  </div>\n" +
    "\n" +
    "  <div class=\"form-group submit\">\n" +
    "  <div class=\" col-lg-10\">\n" +
    "    <save-buttons valid=\"userEmailForm.$valid\"></save-buttons>\n" +
    "  </div>\n" +
    "  </div>\n" +
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
    "      class=\"form-horizontal change-password\"\n" +
    "      ng-submit=\"onSave()\"\n" +
    "      ng-controller=\"passwordSettingsCtrl\"\n" +
    "      >\n" +
    "\n" +
    "   <div class=\"form-group current-password\" ng-class=\"{'has-error': wrongPassword}\">\n" +
    "      <label class=\"control-label col-lg-3\">Current password</label>\n" +
    "      <div class=\"controls col-lg-4\">\n" +
    "         <input ng-model=\"user.currentPassword\" name=\"currentPassword\" type=\"password\" class=\"form-control\" required ng-show=\"!showPassword\">\n" +
    "         <input ng-model=\"user.currentPassword\" name=\"currentPassword\" type=\"text\" class=\"form-control\" required ng-show=\"showPassword\">\n" +
    "      </div>\n" +
    "      <div class=\"controls col-lg-4 show-password\">\n" +
    "         <pretty-checkbox value=\"showPassword\" text=\"Show\"></pretty-checkbox>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group new-password\">\n" +
    "      <label class=\"control-label col-lg-3\">New password</label>\n" +
    "      <div class=\"controls col-lg-4\">\n" +
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
    "      <div class=\" col-lg-offset-4 col-lg-4\">\n" +
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
    "      <label class=\"control-label col-lg-3\">Photo</label>\n" +
    "      <div class=\"controls col-lg-5\">\n" +
    "         <div class=\"my-picture\">\n" +
    "            <a href=\"http://www.gravatar.com\" >\n" +
    "               <img class=\"gravatar\" ng-src=\"http://www.gravatar.com/avatar/{{ currentUser.email_hash }}?s=110&d=mm\" data-toggle=\"tooltip\" class=\"gravatar\" rel=\"tooltip\" title=\"Modify your icon at Gravatar.com\" />\n" +
    "            </a>\n" +
    "            <p>You can change your profile image at <a href=\"http://www.gravatar.com\">Gravatar.com</a></p>\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <label class=\"control-label col-lg-3\">First name</label>\n" +
    "      <div class=\"controls col-lg-5\">\n" +
    "         <input ng-model=\"user.given_name\" name=\"givenname\" class=\"form-control\">\n" +
    "      </div>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <label class=\"control-label col-lg-3\">Surname</label>\n" +
    "      <div class=\"controls col-lg-5\">\n" +
    "         <input ng-model=\"user.surname\" name=\"surname\" class=\"form-control\">\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group submit\">\n" +
    "      <div class=\" col-lg-offset-3 col-lg-9\">\n" +
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

angular.module("signup/signup-creating.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup-creating.tpl.html",
    "<div class=\"signup-input creating\" ng-controller=\"signupCreatingCtrl\">\n" +
    "   <div class=\"intro\"><br>We're creating your profile now! Right now, we're scouring the web, finding the ways your products have made an impact...</div>\n" +
    "\n" +
    "   <div class=\"update-progress\" ng-show=\"numNotDone\">\n" +
    "      <div class=\"products not-done\">\n" +
    "         <span class=\"count still-working\">{{ numNotDone }}</span>\n" +
    "         <span class=\"descr\">now updating</span>\n" +
    "      </div>\n" +
    "\n" +
    "      <div class=\"products done\">\n" +
    "         <span class=\"count finished\">{{ numDone}}</span>\n" +
    "         <span class=\"descr\">done updating</span>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("signup/signup-header.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup-header.tpl.html",
    "<div class=\"signup-header header\" ng-controller=\"signupHeaderCtrl\">\n" +
    "   <h1><a class=\"brand\" href=\"/\"><img src=\"/static/img/impactstory-logo-white.png\" alt=\"ImpactStory\" /></a>\n" +
    "      <span class=\"text\">signup</span>\n" +
    "   </h1>\n" +
    "   <ol class=\"signup-steps\">\n" +
    "      <li ng-repeat=\"stepName in signupSteps\"\n" +
    "          class=\"{{ stepName }}\"\n" +
    "          ng-class=\"{current: isStepCurrent(stepName), completed: isStepCompleted(stepName)}\">\n" +
    "         {{ stepName }}\n" +
    "      </li>\n" +
    "   </ol>\n" +
    "</div>");
}]);

angular.module("signup/signup-name.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup-name.tpl.html",
    "<div class=\"signup-input url\" ng-controller=\"signupNameCtrl\">\n" +
    "   <div class=\"intro\">Making a profile takes less than 5 minutes--let’s get started!</div>\n" +
    "\n" +
    "   <div class=\"form-group\">\n" +
    "      <input required class=\"form-control\" type=\"text\" ng-model=\"input.givenName\" placeholder=\"First name\">\n" +
    "   </div>\n" +
    "   <div class=\"form-group\">\n" +
    "      <input required class=\"input-large form-control\" type=\"text\" ng-model=\"input.surname\" placeholder=\"Last name\">\n" +
    "   </div>\n" +
    "</div>\n" +
    "");
}]);

angular.module("signup/signup-password.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup-password.tpl.html",
    "<div class=\"signup-input email-and-password\" ng-controller=\"signupPasswordCtrl\">\n" +
    "   <div class=\"intro\"><br>Last step! Enter your email and pick a password:<br><span class=\"paren\">(Don't worry, we never share your email)</span></div>\n" +
    "\n" +
    "   <div class=\"form-group email\"\n" +
    "        ng-class=\"{ 'has-error':  signupForm.email.$invalid && signupForm.email.$dirty && !loading.is(),\n" +
    "                 'has-success': signupForm.email.$valid && signupForm.email.$dirty && !loading.is()}\">\n" +
    "\n" +
    "      <div class=\"controls input-group\">\n" +
    "         <span class=\"input-group-addon\"><i class=\"icon-envelope\"></i></span>\n" +
    "         <input ng-model=\"input.email\"\n" +
    "                placeholder=\"email\"\n" +
    "                name=\"email\"\n" +
    "                class=\"form-control\"\n" +
    "                required\n" +
    "                data-require-unique\n" +
    "                 />\n" +
    "\n" +
    "      </div>\n" +
    "      <div class=\"help-info\">\n" +
    "\n" +
    "         <spinner msg=\"Checking\"></spinner>\n" +
    "\n" +
    "         <div class=\"help-block error tall\"\n" +
    "              ng-show=\"signupForm.email.$error.requireUnique\n" +
    "            && signupForm.email.$dirty\n" +
    "            && !loading.is()\">\n" +
    "            That email address is already in use.\n" +
    "         </div>\n" +
    "         <div class=\"help-block success\"\n" +
    "              ng-show=\"signupForm.email.$valid\n" +
    "            && signupForm.email.$dirty\n" +
    "            && !loading.is()\">\n" +
    "            Looks good!\n" +
    "         </div>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <div class=\"form-group password\"\n" +
    "         ng-class=\"{'has-success': signupForm.password.$valid && !loading.is()}\">\n" +
    "\n" +
    "\n" +
    "\n" +
    "      <div class=\"controls input-group\">\n" +
    "         <span class=\"input-group-addon\"><i class=\"icon-key\"></i></span>\n" +
    "\n" +
    "         <input ng-model=\"input.password\"\n" +
    "                name=\"password\"\n" +
    "                type=\"password\"\n" +
    "                placeholder=\"password\"\n" +
    "                ng-show=\"!showPassword\"\n" +
    "                class=\"form-control\"\n" +
    "                required>\n" +
    "\n" +
    "         <input ng-model=\"input.password\"\n" +
    "                name=\"password\"\n" +
    "                type=\"text\"\n" +
    "                placeholder=\"password\"\n" +
    "                ng-show=\"showPassword\"\n" +
    "                class=\"form-control\"\n" +
    "                required>\n" +
    "      </div>\n" +
    "      <pretty-checkbox value=\"showPassword\" text=\"Show\"></pretty-checkbox>\n" +
    "\n" +
    "   </div>\n" +
    "\n" +
    "</div>\n" +
    "");
}]);

angular.module("signup/signup-products.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup-products.tpl.html",
    "<div class=\"signup-input signup-products\" ng-controller=\"signupProductsCtrl\">\n" +
    "   <div class=\"intro\">Next, let's import a few of your products from these sources <br><span class=\"paren\">(you can more add more later, too)</span></div>\n" +
    "\n" +
    "\n" +
    "   <div class=\"importers signup-importers\">\n" +
    "      <div class=\"importer\"\n" +
    "           ng-repeat=\"importer in importers\"\n" +
    "           ng-controller=\"importerCtrl\"\n" +
    "           ng-include=\"'importers/importer.tpl.html'\"\n" +
    "           >\n" +
    "      </div>\n" +
    "  </div>\n" +
    "\n" +
    "\n" +
    "\n" +
    "\n" +
    "</div>");
}]);

angular.module("signup/signup-url.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup-url.tpl.html",
    "<div class=\"signup-input url\" ng-controller=\"signupUrlCtrl\">\n" +
    "   <div class=\"intro\"><br>Great, {{ givenName }}, your next step is to pick your profile's custom URL. <br><span class=\"paren\">(you can always change this later)</span></div>\n" +
    "   \n" +
    "   <div class=\"form-group custom-url\"\n" +
    "        ng-model=\"profileAbout.url_slug\"\n" +
    "        ng-class=\"{ 'has-error':  signupForm.url_slug.$invalid && signupForm.url_slug.$dirty && !loading.is(),\n" +
    "                    'has-success': signupForm.url_slug.$valid && !loading.is()}\">\n" +
    "\n" +
    "      <div class=\"controls input-group\">\n" +
    "         <span class=\"input-group-addon\">http://impactstory.org/</span>\n" +
    "         <input ng-model=\"input.url_slug\"\n" +
    "                name=\"url_slug\"\n" +
    "                class=\"form-control\"\n" +
    "                required\n" +
    "                data-require-unique\n" +
    "                data-check-initial-value=\"true\"\n" +
    "                ng-pattern=\"/^\\w+$/\"\n" +
    "                 />\n" +
    "\n" +
    "      </div>\n" +
    "      <div class=\"help-info\">\n" +
    "         <spinner msg=\"Checking\"></spinner>\n" +
    "\n" +
    "         <div class=\"help-block error\"\n" +
    "              ng-show=\"signupForm.url_slug.$error.pattern\n" +
    "               && signupForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            Sorry, this URL has invalid characters.<br> You can only use numbers or Latin letters (without diacritics).\n" +
    "         </div>\n" +
    "\n" +
    "         <div class=\"help-block error\"\n" +
    "              ng-show=\"signupForm.url_slug.$error.requireUnique\n" +
    "               && signupForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            Sorry, someone else is using that URL.<br>Try changing it to make it more unique.\n" +
    "         </div>\n" +
    "         <div class=\"help-block success\"\n" +
    "              ng-show=\"signupForm.url_slug.$valid\n" +
    "               && signupForm.url_slug.$dirty\n" +
    "               && !loading.is()\">\n" +
    "            This URL looks good!\n" +
    "         </div>\n" +
    "      </div>\n" +
    "\n" +
    "\n" +
    "   </div>\n" +
    "</div>");
}]);

angular.module("signup/signup.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("signup/signup.tpl.html",
    "\n" +
    "<form class=\"signup name form-horizontal\" name=\"signupForm\">\n" +
    "   <div ng-include=\"include\"></div>\n" +
    "\n" +
    "   <button type=\"submit\"\n" +
    "           class=\"next-button\"\n" +
    "           ng-click=\"nav.goToNextStep()\"\n" +
    "           ng-class=\"{'next-button': true, enabled: signupForm.$valid}\"\n" +
    "           ng-disabled=\"signupForm.$invalid\">\n" +
    "      <span class=\"text\">Next</span>\n" +
    "      <i class=\"icon-arrow-right\"></i>\n" +
    "   </button>\n" +
    "</form>\n" +
    "\n" +
    "\n" +
    "");
}]);

angular.module("update/update-progress.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("update/update-progress.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h3>Finding impact data</h3>\n" +
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
    "</div>\n" +
    "\n" +
    "<!--  58@e.com -->");
}]);
