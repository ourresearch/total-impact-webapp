angular.module('directives.forms', [])
.directive('prettyCheckbox', function(){
  // mostly from http://jsfiddle.net/zy7Rg/6/
  return {
    template: '<div class="checkmark-and-text"><i class="icon-check" ng-show=value></i>' +
      '<i class="icon-check-empty" ng-show=!value></i>' +
      '<span class="text">{{ text }}</span></div>',
    restrict: "E",
    replace: true,
    scope: {
      value: "=" // mirror the scope that was passed in...
    },
    link: function(scope, elem, attrs){
      scope.text = attrs.text;
      elem.bind('click', function() {
        scope.$apply(function(){
          scope.value = !scope.value
        });
      });
    }
  }
})

.directive('saveButtons', function(){
  return {
    templateUrl: 'forms/save-buttons.tpl.html',
    replace: true,
    scope: true,
    require: "^form",
    restrict: "E",
    link:function(scope, elem, attr, formController){
      console.log("valid: ", formController.$valid)
      scope.isValid = function() {
        return formController.$valid;
      }
      console.log(formController)
      scope.isLoading = function(){
        return scope.loading[formController.$name]
      }
    }

  }

})


.directive('requireUnique', function($http, $q) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl) {

      var canceler = $q.defer()
      var userPropertyToCheck = attr.ngModel.split(".")[1];

      var setLoading = function(isLoading) {
        scope.loading[attr.ngModel] = isLoading;
      }

      scope.$watch(attr.ngModel, function(value) {
        ctrl.$setValidity('checkingUnique', false);
        ctrl.$setValidity('requireUnique', true);

        canceler.resolve()

        if (value == scope.authenticatedUser[userPropertyToCheck]){
          ctrl.$setPristine();
          setLoading(false);
          return true;
        }

        canceler = $q.defer()
        setLoading(true);
        var url = '/user/' + value + '/about?id_type=' + userPropertyToCheck;

        $http.get(url, {timeout: canceler.promise})
        .success(function(data) {
          ctrl.$setValidity('requireUnique', false);
          ctrl.$setValidity('checkingUnique', true);
          setLoading(false)
        })
        .error(function(data) {
          if (data) {
            ctrl.$setValidity('requireUnique', true);
            ctrl.$setValidity('checkingUnique', true);
            setLoading(false)
          }
        })
      })
    }
  }
})