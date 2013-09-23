angular.module('product.award', []);
angular.module('product.award').factory('Award', function() {

  return {

    // [noun_form, display_order]
    config: {
      "viewed":["views", 1],
      "discussed": ["discussion", 2],
      "saved": ["saves", 3],
      "cited": ["citation", 4],
      "recommended": ["recommendation", 5]
    }


    ,make: function(audience, engagementType, metrics){

      console.log("makin' metrics: ", metrics)

      return {
        engagementTypeNoun: this.config[engagementType][0]
        ,engagementType: engagementType
        ,audience: audience
        ,displayOrder: this.config[engagementType][1]
        ,topMetric: this.getTopMetric(metrics)
        ,isHighly: this.calculateIsHighly(metrics)
        ,displayAudience: audience.replace("public", "the public")
        ,metrics: metrics
      }
    }


    ,calculateIsHighly: function(metrics){

      return _.some(metrics, function(metric){
        if (typeof metric.percentiles === "undefined") {
          return false
        }
        else if (metric.percentiles.CI95_lower >= 75
          && metric.actualCount >= metric.minForAward) {
          return true
        }
        else {
          return false
        }
      })
    }


    ,getTopMetric: function(metrics) {
      // sort by CI95, then by the raw count if CI95 is tied

      var maxCount = _.max(metrics, function(x) {
        return x.actualCount;
      }).actualCount;

      var topMetric = _.max(metrics, function(x){

        var rawCountContribution =  (x.actualCount / maxCount - .0001) // always < 1
        if (typeof x.percentiles == "undefined") {
          return rawCountContribution;
        }
        else {
          return x.percentiles.CI95_lower + rawCountContribution;
        }
      });

      return topMetric
    }
  }
});
