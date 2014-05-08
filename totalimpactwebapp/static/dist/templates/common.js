angular.module('templates.common', ['forms/save-buttons.tpl.html', 'security/login/form.tpl.html', 'security/login/reset-password-modal.tpl.html', 'security/login/toolbar.tpl.html']);

angular.module("forms/save-buttons.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("forms/save-buttons.tpl.html",
    "<div class=\"buttons-group save\">\n" +
    "   <div class=\"buttons\" ng-show=\"!loading.is('saveButton')\">\n" +
    "      <button\n" +
    "              class=\"btn btn-primary action\"\n" +
    "              ng-disabled=\"!isValid()\"\n" +
    "              type=\"submit\">\n" +
    "         {{ action }}\n" +
    "      </button>\n" +
    "      <a\n" +
    "              class=\"btn btn-default cancel\"\n" +
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
    "<div class=\"modal-header\">\n" +
    "   <h4>Sign in</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"cancel()\">&times;</a>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "   <div id=\"user-message-modal\">\n" +
    "      <div ng-class=\"['alert', 'alert-'+userMessage.get().type]\"\n" +
    "           ng-animate=\"{enter: 'animated fadeInDown', leave:'animated fadeOutUp'}\"\n" +
    "           ng-if=\"userMessage.get().message\">\n" +
    "             <span class=\"text\" ng-bind-html-unsafe=\"userMessage.get().message\"></span>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "\n" +
    "   <form name=\"loginForm\" novalidate class=\"login-form form-inline\" autocomplete=\"off\">\n" +
    "      <div class=\"form-group\" >\n" +
    "         <label class=\"sr-only\">E-mail</label>\n" +
    "         <div class=\"controls input-group\" has-focus ng-class=\"{'has-success': loginForm.login.$valid}\">\n" +
    "            <span class=\"input-group-addon\"><i class=\"icon-envelope-alt\"></i></span>\n" +
    "            <input name=\"login\" required autofocus\n" +
    "                   autocomplete=\"off\"\n" +
    "                   class=\"form-control\"\n" +
    "                   type=\"username\"\n" +
    "                   ng-model=\"user.email\"\n" +
    "                   placeholder=\"email\" >\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"sr-only\">Password</label>\n" +
    "         <div class=\"controls input-group\" has-focus ng-class=\"{'has-success': loginForm.pass.$valid}\">\n" +
    "            <span class=\"input-group-addon\"><i class=\"icon-key\"></i></span>\n" +
    "            <input name=\"pass\" required\n" +
    "                   autocomplete=\"off\"\n" +
    "                   class=\"form-control\"\n" +
    "                   type=\"password\"\n" +
    "                   ng-model=\"user.password\"\n" +
    "                   placeholder=\"password\">\n" +
    "         </div>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "         <button class=\"btn btn-primary login\"\n" +
    "            ng-disabled='loginForm.$invalid'\n" +
    "            ng-click=\"login()\"\n" +
    "            ng-hide=\"loading.is('login')\">Sign in</button>\n" +
    "\n" +
    "         <div class=\"working\" ng-show=\"loading.is('login')\">\n" +
    "            <i class=\"icon-refresh icon-spin\"></i>\n" +
    "            <span class=\"text\">logging in...</span>\n" +
    "         </div>\n" +
    "         <a class=\"forgot-login-details\" ng-click=\"showForgotPasswordModal()\">\n" +
    "            <i class=\"icon-question-sign\"></i>\n" +
    "            Forgot your login details?\n" +
    "         </a>\n" +
    "      </div>\n" +
    "   </form>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("security/login/reset-password-modal.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/reset-password-modal.tpl.html",
    "<div class=\"modal-header\">\n" +
    "   <h4>Reset password</h4>\n" +
    "   <a class=\"dismiss\" ng-click=\"close()\">&times;</a>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"modal-body\">\n" +
    "   <form name=\"form\" ng-show=\"!emailSubmitted()\" novalidate class=\"reset-password creds form-inline\">\n" +
    "      <div class=\"inst\">Enter your email and we'll send you instructions on how to reset your password.</div>\n" +
    "      <div class=\"form-group\">\n" +
    "         <label class=\"sr-only\">E-mail</label>\n" +
    "         <input name=\"login\" class=\"form-control\" type=\"email\" ng-model=\"user.email\" placeholder=\"email\" required autofocus>\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "         <button class=\"btn btn-primary login\" ng-click=\"sendEmail()\" ng-disabled='form.$invalid'>Reset password</button>\n" +
    "      </div>\n" +
    "   </form>\n" +
    "   <div ng-show=\"emailSubmitted()\" class=\"email-submitted\">\n" +
    "      <div class=\"inst\">\n" +
    "         We've sent you password reset email. It should arrive in a few minutes\n" +
    "         (don't forget to check your spam folder).\n" +
    "      </div>\n" +
    "      <div class=\"modal-footer\">\n" +
    "         <button class=\"btn btn-primary cancel\" ng-click=\"close()\">OK</button>\n" +
    "      </div>\n" +
    "   </div>\n" +
    "</div>\n" +
    "\n" +
    "");
}]);

angular.module("security/login/toolbar.tpl.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("security/login/toolbar.tpl.html",
    "<ul class=\"main-nav\">\n" +
    "   <li ng-show=\"currentUser\" class=\"logged-in-user nav-item\">\n" +
    "      <a class=\"current-user\"\n" +
    "         href=\"/{{ currentUser.url_slug }}\"\n" +
    "         tooltip=\"View your profile\"\n" +
    "         tooltip-placement=\"bottom\">\n" +
    "         {{currentUser.given_name}}\n" +
    "         {{currentUser.surname}}\n" +
    "      </a>\n" +
    "   </li>\n" +
    "\n" +
    "   <li ng-show=\"currentUser\" class=\"controls nav-item\">\n" +
    "\n" +
    "      <span class=\"or\"></span>\n" +
    "\n" +
    "      <a class=\"new-metrics control no-new-metrics\"\n" +
    "         tooltip=\"No new metrics.\"\n" +
    "         tooltip-placement=\"bottom\"\n" +
    "         ng-show=\"!illuminateNotificationIcon()\"\n" +
    "         href=\"/{{ currentUser.url_slug }}\">\n" +
    "         <i class=\"icon-bell\"></i>\n" +
    "      </a>\n" +
    "      <a class=\"new-metrics control has-new-metrics\"\n" +
    "         tooltip=\"You've got new metrics!\"\n" +
    "         tooltip-placement=\"bottom\"\n" +
    "         ng-show=\"illuminateNotificationIcon()\"\n" +
    "         ng-click=\"dismissProfileNewProductsNotification()\"\n" +
    "         href=\"/{{ currentUser.url_slug }}?filter=has_new_metrics\">\n" +
    "         <i class=\"icon-bell-alt\"></i>\n" +
    "      </a>\n" +
    "\n" +
    "      <span class=\"or\"></span>\n" +
    "\n" +
    "      <a class=\"preferences control\"\n" +
    "         href=\"/settings/profile\"\n" +
    "         tooltip=\"Change profile settings\"\n" +
    "         tooltip-placement=\"bottom\">\n" +
    "         <i class=\"icon-cog\"></i>\n" +
    "      </a>\n" +
    "\n" +
    "      <span class=\"or\"></span>\n" +
    "\n" +
    "      <a class=\"logout control\"\n" +
    "         ng-click=\"logout()\"\n" +
    "         tooltip=\"Log out\"\n" +
    "         tooltip-placement=\"bottom\">\n" +
    "         <i class=\"icon-signout\"></i>\n" +
    "      </a>\n" +
    "   </li>\n" +
    "\n" +
    "   <li ng-show=\"!currentUser\" class=\"login-and-signup nav-item\">\n" +
    "      <a ng-show=\"!page.isLandingPage()\" class=\"signup\" href=\"/signup\">Sign up</a>\n" +
    "      <span ng-show=\"!page.isLandingPage()\" class=\"or\"></span>\n" +
    "      <a class=\"login\" ng-click=\"login()\">Log in<i class=\"icon-signin\"></i></a>\n" +
    "   </li>\n" +
    "</ul>\n" +
    "");
}]);
