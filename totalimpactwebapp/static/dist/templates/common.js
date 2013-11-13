angular.module('templates.common', ['forms/save-buttons.tpl.html', 'security/login/form.tpl.html', 'security/login/toolbar.tpl.html']);

angular.module("forms/save-buttons.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("forms/save-buttons.tpl.html",
    "<div class=\"buttons-group save\">\n" +
    "   <div class=\"buttons\" ng-show=\"!loading.is('saveButton')\">\n" +
    "      <button\n" +
    "              class=\"btn btn-primary\"\n" +
    "              ng-disabled=\"!isValid()\"\n" +
    "              type=\"submit\">\n" +
    "         {{ action }}\n" +
    "      </button>\n" +
    "      <a\n" +
    "              class=\"btn btn-default\"\n" +
    "              ng-click=\"onCancel()\">\n" +
    "         Cancel\n" +
    "      </a>\n" +
    "   </div>\n" +
    "   <div class=\"working\" ng-show=\"loading.is('saveButton')\">\n" +
    "      <i class=\"icon-refresh icon-spin\"></i>\n" +
    "      <span class=\"text\">{{ actionGerund }}...</span>\n" +
    "   </div>\n" +
    "\n" +
    "</div>");
}]);

angular.module("security/login/form.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/form.tpl.html",
    "<form name=\"form\" novalidate class=\"login-form\">\n" +
    "    <div class=\"modal-header\">\n" +
    "        <h4>Sign in</h4>\n" +
    "    </div>\n" +
    "    <div class=\"modal-body\">\n" +
    "        <div class=\"alert alert-warning\" ng-show=\"authReason\">\n" +
    "            {{authReason}}\n" +
    "        </div>\n" +
    "        <div class=\"alert alert-error\" ng-show=\"authError\">\n" +
    "            {{authError}}\n" +
    "        </div>\n" +
    "        <div class=\"alert alert-info\">Please enter your login details</div>\n" +
    "        <label>E-mail</label>\n" +
    "        <input name=\"login\" type=\"email\" ng-model=\"user.email\" required autofocus>\n" +
    "        <label>Password</label>\n" +
    "        <input name=\"pass\" type=\"password\" ng-model=\"user.password\" required>\n" +
    "    </div>\n" +
    "    <div class=\"modal-footer\">\n" +
    "        <button class=\"btn btn-primary login\" ng-click=\"login()\" ng-disabled='form.$invalid'>Sign in</button>\n" +
    "        <button class=\"btn cancel\" ng-click=\"cancel()\">Cancel</button>\n" +
    "    </div>\n" +
    "</form>\n" +
    "");
}]);

angular.module("security/login/toolbar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/toolbar.tpl.html",
    "<ul class=\"nav pull-right\">\n" +
    "   <li ng-show=\"isAuthenticated()\" class=\"logged-in-user\">\n" +
    "      <span class=\"context\">Welcome back, </span>\n" +
    "      <a class=\"current-user\" href=\"/{{ currentUser.url_slug }}\">{{currentUser.given_name}}</a>\n" +
    "   </li>\n" +
    "   <li ng-show=\"isAuthenticated()\" class=\"divider-vertical\"></li>\n" +
    "   <li ng-show=\"isAuthenticated()\" class=\"logged-in preferences dropdown\">\n" +
    "      <a href=\"#\" class=\"preferences dropdown-toggle\" data-toggle=\"dropdown\" title=\"Change URL and other preferences\">\n" +
    "         <i class=\"icon-cog\"></i>\n" +
    "      </a>\n" +
    "      <ul class='preferences-actions dropdown-menu'>\n" +
    "         <li><a href=\"/settings/profile\" class=\"profile\"><i class=\"icon-cogs\"></i>Preferences</a></li>\n" +
    "         <li><a href=\"/api-docs\" class=\"profile\"><i class=\"icon-suitcase\"></i>Embed</a></li>\n" +
    "         <li class=\"divider\"></li>\n" +
    "         <li><a href=\"#\" class=\"logout\" ng-click=\"logout()\"><i class=\"icon-off\"></i>Log out</a></li>\n" +
    "      </ul>\n" +
    "   </li>\n" +
    "\n" +
    "   <li ng-hide=\"isAuthenticated()\" class=\"login\">\n" +
    "      <form class=\"navbar-form\">\n" +
    "         <span class=\"context\">Already have a profile?</span>\n" +
    "         <a class=\"login\" ng-click=\"login()\">Log in<i class=\"icon-signin\"></i></a>\n" +
    "      </form>\n" +
    "   </li>\n" +
    "</ul>");
}]);
