angular.module('product.product', ['product.award'])
angular.module('product.product').factory('Product', function(Award) {


  var itemOmitUndefinedv = function(obj) { return _.omit(obj, "undefined")}


  /* the metricInfo keys are mapped to the metricInfo array to save space;
   *  the finished dict looks like this:
   *  {
   *      "topsy:tweets": {name: "topsy:tweets", audience: "public", ... },
   *      "mendeley:groups": {name: "mendeley:groups", audience: "scholars",...},
   *      ...
   *  }
   */
  var metricInfoKeys = ["name", "audience", "engagementType", "display", "minForAward"]
  var metricInfo = _.object(
    _.map([
            ["citeulike:bookmarks", "scholars", "saved", "badge", 3],
            ["crossref:citations", "scholars", "cited", "badge", 3],
            ["delicious:bookmarks", "public", "saved", "badge", 3],
            ["dryad:most_downloaded_file"],
            ["dryad:package_views", "scholars", "viewed", "badge", 3],
            ["dryad:total_downloads", "scholars", "viewed", "badge", 3],
            ["figshare:views", "scholars", "viewed", "badge", 3],
            ["figshare:downloads", "scholars", "viewed", "badge", 3],
            ["figshare:shares", "scholars", "discussed", "badge", 3],
            ["facebook:shares", "public", "discussed", "badge", 3],
            ["facebook:comments", "public", "discussed", "badge", 3],
            ["facebook:likes", "public", "discussed", "badge", 3],
            ["facebook:clicks", "public", "discussed", "badge", 3],
            ["github:forks", "public", "cited", "badge", 3],
            ["github:stars", "public", "recommended", "badge", 3],
            ["github:watchers", "public", "saved", "badge", 3],  // depricate this later
            ["mendeley:career_stage"],
            ["mendeley:country"],
            ["mendeley:discipline"],
            ["mendeley:student_readers"], // display later
            ["mendeley:developing_countries"], // display later
            ["mendeley:groups"],
            ["mendeley:readers", "scholars", "saved", "badge", 3],
            ["pmc:pdf_downloads"],
            ["pmc:abstract_views"],
            ["pmc:fulltext_views"],
            ["pmc:unique_ip_views"],
            ["pmc:figure_views"],
            ["pmc:suppdata_views"],
            ["plosalm:crossref" ],                    // figure it out
            ["plosalm:html_views", "public", "viewed", "badge", 3],
            ["plosalm:pdf_views", "scholars", "viewed", "badge", 3],
            ["plosalm:pmc_abstract"],
            ["plosalm:pmc_figure"],
            ["plosalm:pmc_full-text"],
            ["plosalm:pmc_pdf"],
            ["plosalm:pmc_supp-data"],
            ["plosalm:pmc_unique-ip"],
            ["plosalm:pubmed_central"],
            ["plosalm:scopus"],                      // figure it out
            ["plossearch:mentions", "scholars", "cited", "badge", 3],
            ["pubmed:f1000", "scholars", "recommended", "badge", 1],
            ["pubmed:pmc_citations", "scholars", "cited", "badge", 3],
            ["pubmed:pmc_citations_editorials"],
            ["pubmed:pmc_citations_reviews"],
            ["scienceseeker:blog_posts", "scholars", "discussed", "badge", 3],
            ["scopus:citations", "scholars", "cited", "badge", 3],
            ["researchblogging:blogs", "scholars", "discussed"],
            ["slideshare:comments", "public", "discussed", "badge", 3],
            ["slideshare:downloads", "public", "viewed", "badge", 3],
            ["slideshare:favorites", "public", "recommended", "badge", 3],
            ["slideshare:views", "public", "viewed", "badge", 3],
            ["topsy:influential_tweets", "public", "discussed", "zoom", 0],
            ["topsy:tweets", "public", "discussed", "badge", 3],
            ["wikipedia:mentions", "public", "cited", "badge", 3]
          ],
          function(metric){ // second arg in map() call
            return[ metric[0], _.object(metricInfoKeys, metric )]
          })
  )






  return {

    makeMetrics: function(itemData){
      var metrics = itemData.metrics
      metrics = this.addMetricsInfoDataToMetrics(metrics)
      metrics = this.expandMetricMetadta(metrics, itemData.biblio.year)
      metrics = this.getMetricPercentiles(metrics)
      return metrics
    }

    ,makeBiblio: function(itemData) {
      var biblio = itemData.biblio
      biblio.url = (itemData.aliases.url) ?  itemData.aliases.url[0] : false
      biblio.title = biblio.title || "no title"
      if (biblio.authors) {
        // screws up names w/ commas in them
        var auths = biblio.authors.split(",", 3).join(",") // first 3 authors
        if (auths.length < biblio.authors.length) auths += " et al."
        biblio.authors = auths
      }

      return biblio
    }
    

  ,makeAwards: function(itemData) {
      
      metrics = this.makeMetrics(itemData)
      
      var awards = []
      var audiencesObj = itemOmitUndefinedv(_.groupBy(metrics, "audience"))
      _.each(audiencesObj, function(audienceMetrics, audienceName) {

        var engagementTypesObj = itemOmitUndefinedv(_.groupBy(audienceMetrics, "engagementType"))
        _.each(engagementTypesObj, function(engagementType, engagementTypeName) {
          var awardDict = Award.make(audienceName, engagementTypeName, engagementType)
          awards.push(awardDict)
        })
      })

      return awards
    }



    // developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
    // see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
    ,developing_countries: "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|C\u00F4te d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|S\u00E3o Tom\u00E9 and Pr\u00EDncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"


    ,addMetricsInfoDataToMetrics: function(metrics) {
      _.map(metrics, function(metric, metricName){
        _.extend(metric, metricInfo[metricName])
      })
      return metrics
    }

    ,get_mendeley_percent: function(metricDict, key_substring) {

      if (metricDict == undefined) {
        return 0
      }

      // values.raw holds an array of {name:<name>, value: <value>} objects.
      // this gets just ones where key_substring is a substring of <name>
      var re = new RegExp(key_substring, 'i');
      var mendeleyRelevantKeys = metricDict.values.raw.filter(function(x) {return x["name"].match(re)})
      if (typeof mendeleyRelevantKeys[0] == "undefined") {
        // no students or developing countries or whatever
        return(0)
      }

      // list the percent scores for values whose names match our substring
      var mendeleyPercentages = mendeleyRelevantKeys.map(function(x) {return x["value"]})
      if (typeof mendeleyPercentages[0] == "undefined") {  // not sure if this needs to be here?
        return(0)
      }

      sum = eval(mendeleyPercentages.join("+")) // dangerous, replace
      return(sum)
    }


    ,mendeley_reader_subset_count: function(metricsDict, subset_type){
      var percent

      // given all the metrics, gets the count of a certain subset of readers by type
      if (typeof metricsDict["mendeley:readers"] == "undefined") {
        // can't get a subset of readers if there are no readers
        return(0)
      }

      if (subset_type == "student") {
        percent = this.get_mendeley_percent(
          metricsDict["mendeley:career_stage"],
          "student"
        )
      }
      if (subset_type == "developing_countries") {
        percent = this.get_mendeley_percent(
          metricsDict["mendeley:country"],
          this.developing_countries
        )
      }

      total_mendeley_readers = metricsDict["mendeley:readers"].values.raw

      // here we figure actual number from percentage
      total = Math.round(total_mendeley_readers * percent / 100)

      return(total)
    }


    ,update_metric: function(metric, display_name, value) {
      metric["static_meta"]["display_name"] = display_name
      metric["values"] = {}
      metric["values"]['raw'] = value
      return(metric)
    }


    ,add_derived_metrics: function(metricsDict) {
      var templateMetric
      var newMetric

      // mendeley student readers
      var total = this.mendeley_reader_subset_count(metricsDict, "student")
      if (total > 0) {
        templateMetric = $.extend(true, {}, metricsDict["mendeley:readers"])
        newMetric = this.update_metric(templateMetric,
                                           "readers: students",
                                           total)
        metricsDict["mendeley:student_readers"] = newMetric
      }

      // mendeley developing countries
      var total = this.mendeley_reader_subset_count(metricsDict, "developing_countries")
      if (total > 0) {
        templateMetric = $.extend(true, [], metricsDict["mendeley:readers"])
        newMetric = this.update_metric(templateMetric,
                                           "readers: developing countries",
                                           total)
        metricsDict["mendeley:developing_countries"] = newMetric
      }

      return(metricsDict)
    }


    ,getMetricPercentiles: function(metricsDict) {
      for (var metricName in metricsDict) {
        for (var normRefSetName in metricsDict[metricName].values) {
          if (normRefSetName.indexOf("raw") == -1) {
            metricsDict[metricName].percentiles = metricsDict[metricName].values[normRefSetName]
            metricsDict[metricName].topPercent =
              100 - metricsDict[metricName].percentiles.CI95_lower

            // hacky short-term way to determine which reference set was used
            var refSet
            if (normRefSetName == "WoS") {
              refSet = "Web of Science"
              storageVerb = "indexed by"
            }
            else if (normRefSetName == "dryad"){
              refSet = "Dryad"
              storageVerb = "added to"
            }
            else if (normRefSetName == "figshare"){
              refSet = "figshare"
              storageVerb = "added to"
            }
            else if (normRefSetName == "github"){
              refSet = "GitHub"
              storageVerb = "added to"
            }
            metricsDict[metricName].refSet = refSet
            metricsDict[metricName].referenceSetStorageVerb = storageVerb
          }
        }
      }
      return metricsDict
    }


    ,expandMetricMetadta: function(metrics, year) {
      var interactionDisplayNames = {
        "f1000": "recommendations",
        "pmc_citations": "citations"
      }

      _.map(metrics, function(metric) {
        metric.displayCount = metric.values.raw

        // deal with F1000's troublesome "count" of "Yes." Can add others later.
        metric.actualCount = (metric.values.raw == "Yes") ? 1 : metric.values.raw

        var plural = metric.actualCount > 1

        // add the environment and what's the user did:
        metric.environment = metric.static_meta.provider
        var interaction = metric.name.split(":")[1].replace("_", " ")
        if (interactionDisplayNames[interaction]){
          interaction = interactionDisplayNames[interaction]
        }

        metric.displayInteraction = (plural) ? interaction : interaction.slice(0, -1)


        // other things
        metric.referenceSetYear = year
      })


      return metrics
    }



  };
})

  .controller('productCtrl', function ($scope, Product, $location, security) {

      $scope.biblio = Product.makeBiblio($scope.product)
      $scope.metrics = Product.makeMetrics($scope.product)
      $scope.awards = Product.makeAwards($scope.product)

  })

  .directive('productBiblio', function(Product) {
    return {
      restrict: 'A',
      link: function(scope, elem, atts) {

      }
    }


  })
































function ItemView($) {

  this.sortByMetricValueDesc = function(metric1, metric2){
    if (typeof metric1.value != "number")
      return 1
    if (typeof metric2.value != "number")
      return -1
    if (metric1.value < metric2.value)
      return 1;
    if (metric1.value > metric2.value)
      return -1;
    return 0;
  }



  this.findBarLabelOffsets = function(start, end) {
    var minWidth = 27
    if (end == 100) {
      minWidth = 32
    }

    var width = end - start
    if (width < minWidth) {
      var widthToAdd = width - minWidth
      var offset = widthToAdd / 2
    }
    else {
      var offset = 0
    }

    return offset
  }

  this.findBarMargins = function(CIstart, CIend) {
    var minWidth = 7
    var leftMargin = CIstart
    var rightMargin = 100 - CIend

    var amountLessThanMinWidth = minWidth - (CIend - CIstart)
    if (amountLessThanMinWidth > 0) {
      leftMargin -= amountLessThanMinWidth / 2
      rightMargin -= amountLessThanMinWidth / 2
    }


    return [leftMargin, rightMargin]
  }


  this.renderZoom = function(awards) {
    // first make this into a 2-D array
    var engagementTable = {}
    engagementTable.audiences = _.chain(awards)
      .groupBy("audience")
      .map(function(awards, audienceName) {
             return {
               audience: audienceName,
               cells:_.sortBy(awards, function(x){ return x.displayOrder})
             }
           })
      .sortBy(function(x){ return x.audience})
      .reverse()
      .value()

    var zoom$ = $(ich.zoomTable(engagementTable, true))

    var thisThing = this
    zoom$.find("div.metric-perc-range.ci").each(function(){

      // where does the bar go?
      var ciStartValue = $(this).find("span.endpoint.start span.value").text()
      var ciEndValue = $(this).find("span.endpoint.end span.value").text()

      var offset = thisThing.findBarLabelOffsets(ciStartValue, ciEndValue)

      var margins = thisThing.findBarMargins(ciStartValue, ciEndValue)

      $(this).css(
        {
          "margin-left":margins[0]+"%",
          "margin-right":margins[1]+"%"
        })
        .find("span.endpoint.start").css("left", offset+"px")
        .end()
        .find("span.endpoint.end").css("right", offset+"px")
    })
    zoom$.find("ul.metrics div.meta img").tooltip()
    zoom$.find("ul.metrics div.metric-perc-range").tooltip()
    return zoom$
  }

  this.renderBadges = function(awards) {

    awards = _.sortBy(awards, "audience").reverse()
    var awardsForRendering = _(awards).groupBy("isHighly")
    var badges$ = $(ich.badges({
                                 big: awardsForRendering["true"],
                                 any:awardsForRendering["false"]
                               }), true)
    badges$.find(".ti-badge").popover({
                                        trigger:"hover",
                                        placement:"bottom",
                                        html:"true"
                                      })
    return badges$
  }

  this.render = function(item){
    var item$ = ich.displayItem(item)

    var url = (item.aliases.url) ?  item.aliases.url[0] : false
    var biblio$ = this.renderBiblio(item.biblio, url)
    item$.find("div.biblio").append(biblio$)

    if (item.awards.length > 0) {
      var zoom$ = this.renderZoom(item.awards, true)
      item$.find("div.zoom").append(zoom$)

      var badges$ = this.renderBadges(item.awards)
      item$.find("div.badges").append(badges$)
    }
    else {
      item$.find("div.zoom").append(
        "<span>We weren't able to find any impact data for this item</span>")
      item$.addClass("no-data")

    }

    return item$
  }
}

