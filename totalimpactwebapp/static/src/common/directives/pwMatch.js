angular.module('directives.pwMatch', [])
  // from http://blog.brunoscopelliti.com/angularjs-directive-to-check-that-passwords-match


  .directive('pwMatch', [function () {
    return {
      require: 'ngModel',
      link: function (scope, elem, attrs, ctrl) {
        var firstPassword = '#' + attrs.pwMatch;
        elem.add(firstPassword).on('keyup', function () {
          scope.$apply(function () {
            var v = (elem.val()===$(firstPassword).val());
            ctrl.$setValidity('pwmatch', v);
          });
        });
      }
    }
  }]);