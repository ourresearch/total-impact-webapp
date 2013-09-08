angular.module('resources.user', ['restangular'])


    .factory('User',["restangular", function(restangular){
        var user = {
            given_name: "",
            middle_names: "",
            surname: "",
            password_hash: "",
            email: "",
            aliases_list: []
        }

        user.store = function(){
            console.log("storing this User!", user)
            restangular.post(this)
        }

        return user
    }])


;


