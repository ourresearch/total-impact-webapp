angular.module('directives.forms', [])
.directive('saveAndCancelButtons', function(){
  return {
    require: "^form",
    templateUrl: 'directives/forms/save-and-cancel-buttons.tpl.html',
    link: function(scope, elem, attrs, form){

    }



  }
})