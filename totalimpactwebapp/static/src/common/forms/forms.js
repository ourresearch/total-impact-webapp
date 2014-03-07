angular.module('directives.forms', ["services.loading"])


  .directive("ngFileSelect",function(){
    return {
      link: function($scope, el, attrs){
        el.bind("change", function(e){
          var reader = new FileReader()
          reader.onload = function(e){
            $scope.setFileContents(reader.result)

          }

          var file = (e.srcElement || e.target).files[0];
          reader.readAsText(file)
        })
      }
    }
  })





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

.directive('saveButtons', function(Loading){
  return {
    templateUrl: 'forms/save-buttons.tpl.html',
    replace: true,
    scope: true,
    require: "^form",
    restrict: "E",
    link:function(scope, elem, attr, formController){
      scope.loading = Loading
      if (attr.action) {
        scope.action = attr.action
        scope.actionGerund = attr.action + "ing"
      }
      else {
        scope.action = "Save"
        scope.actionGerund = "Saving"
      }

      scope.isValid = function() {
        return formController.$valid;
      }
    }
  }

})
.directive('hasFocus', function() {
    return {
      restrict: 'A',
      link: function(scope, elem, attr, ctrl){
        elem.find("input")
          .bind("focus", function(){
            elem.addClass("has-focus")
          })
          .bind("blur", function(){
            elem.removeClass("has-focus")
          })
      }
    }
})


.directive('requireUnique', function($http, $q, Loading) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, elem, attr, ctrl) {

      var canceler = $q.defer()
      var modelParts =  attr.ngModel.split(".")
      var userModelName = modelParts[0]
      var userPropertyToCheck = modelParts[1];

      var initialValue = scope[userModelName][userPropertyToCheck]

      scope.$watch(attr.ngModel, function(value) {
        ctrl.$setValidity('checkingUnique', false);
        ctrl.$setValidity('requireUnique', true);

        canceler.resolve()

        if (!attr.checkInitialValue && value == initialValue){
          ctrl.$setPristine();
          ctrl.$setValidity('requireUnique', true);
          ctrl.$setValidity('checkingUnique', true);

          Loading.finish('requireUnique');
          return true;
        }

        canceler = $q.defer()
        Loading.start('requireUnique');
        var url = '/user/' + value + '/about?id_type=' + userPropertyToCheck;

        $http.get(url, {timeout: canceler.promise})
        .success(function(data) {
          ctrl.$setValidity('requireUnique', false);
          ctrl.$setValidity('checkingUnique', true);
          ctrl.$dirty = true;
          Loading.finish('requireUnique')
        })
        .error(function(data) {
          if (data) {
            ctrl.$setValidity('requireUnique', true);
            ctrl.$setValidity('checkingUnique', true);
            ctrl.$dirty = true;
            Loading.finish('requireUnique')
          }
        })
      })
    }
  }
})