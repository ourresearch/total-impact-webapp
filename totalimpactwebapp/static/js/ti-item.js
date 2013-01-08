var omitUndefined = function(obj) { return _.omit(obj, "undefined")}


// patch Array.filter() for IE8
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/filter#Compatibility

if (!Array.prototype.filter)
{
    Array.prototype.filter = function(fun /*, thisp */)
    {
        "use strict";

        if (this == null)
            throw new TypeError();

        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();

        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++)
        {
            if (i in t)
            {
                var val = t[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }

        return res;
    };
}


// Patch Array.map() for IE8
// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/map#Browser_compatibility

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.com/#x15.4.4.19
if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {

        var T, A, k;

        if (this == null) {
            throw new TypeError(" this is null or not defined");
        }

        // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
        var O = Object(this);

        // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;

        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== "function") {
            throw new TypeError(callback + " is not a function");
        }

        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (thisArg) {
            T = thisArg;
        }

        // 6. Let A be a new array created as if by the expression new Array(len) where Array is
        // the standard built-in constructor with that name and len is the value of len.
        A = new Array(len);

        // 7. Let k be 0
        k = 0;

        // 8. Repeat, while k < len
        while(k < len) {

            var kValue, mappedValue;

            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {

                // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
                kValue = O[ k ];

                // ii. Let mappedValue be the result of calling the Call internal method of callback
                // with T as the this value and argument list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);

                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor {Value: mappedValue, : true, Enumerable: true, Configurable: true},
                // and false.

                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });

                // For best browser support, use the following:
                A[ k ] = mappedValue;
            }
            // d. Increase k by 1.
            k++;
        }

        // 9. return A
        return A;
    };
}




var Award = function(audience, engagementType, metrics) {
    this.audience = audience
    this.engagementType = engagementType
    this.metrics = metrics
    this.init()
}
Award.prototype = {
    engagementTypeNounsList: {
        "viewed":"views",
        "discussed": "discussion",
        "saved": "saves",
        "cited": "citation",
        "recommended": "recommendation"
    },

    init: function() {
        this.engagementTypeNoun = this.engagementTypeNounsList[this.engagementType]
        this.topMetric = this.getTopMetric(this.metrics)
        this.isHighly = this.isHighly(this.metrics)
        this.displayAudience = this.audience.replace("public", "the public")
    },

    isHighly: function(metrics){

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
    },

    getTopMetric: function(metrics) {
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




function Item(itemData, itemView, $) {

    this.makeAwardsList = function(metrics) {
        var awards = []
        var audiencesObj = omitUndefined(_.groupBy(metrics, "audience"))
        _.each(audiencesObj, function(audienceMetrics, audienceName) {

            var engagementTypesObj = omitUndefined(_.groupBy(audienceMetrics, "engagementType"))
            _.each(engagementTypesObj, function(engagementType, engagementTypeName) {

                awards.push(new Award(audienceName, engagementTypeName, engagementType))
            })
        })

        // hack for backwards compatibility with Pensoft embed:
        if (awards.length) {
            awards.big = ["here is an item"]
            awards.any = ["here is an item"]
        }

        return awards
    }

    this.init = function(itemData, itemView){

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
                ["github:stars", "public", "saved", "badge", 3],
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
                ["pubmed:pmc_citations", "scholars", "cited", 0, 0],
                ["pubmed:pmc_citations_editorials", "scholars", "recommended", 0, 0],
                ["pubmed:pmc_citations_reviews", "scholars", "cited", 0, 0],
                ["scienceseeker:blog_posts", "scholars", "discussed", "badge", 0],
                ["scopus:citations", "scholars", "cited", "badge", 3],
                ["researchblogging:blogs", "scholars", "discussed", 0, 0],
                ["slideshare:comments", "public", "discussed", "badge", 3],
                ["slideshare:downloads", "public", "viewed", "badge", 3],
                ["slideshare:favorites", "public", "recommended", "badge", 3],
                ["slideshare:views", "public", "viewed", "badge", 3],
                ["topsy:influential_tweets", "public", "discussed", "zoom", 0],
                ["topsy:tweets", "public", "discussed", "badge", 3],
                ["wikipedia:mentions", "public", "cited", "badge", 1]
            ],
            function(metric){ // second arg in map() call
                return[ metric[0], _.object(metricInfoKeys, metric )]
            })
        )


        this.metricInfo = metricInfo

        this.itemView = itemView

        if (itemData.hasOwnProperty("_id")) {
            this.dict = this.processDict(itemData)
        }
        // we've created this item with an id instead of a data object;
        else {
            this.dict = false
            this.itemId = itemData
        }
    }




    // developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
    // see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
    this.developing_countries = "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|C\u00F4te d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|S\u00E3o Tom\u00E9 and Pr\u00EDncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"

    this.render = function() {
        return this.itemView.render(this.dict)
    }

    this.addMetricsInfoDataToMetrics = function(metrics) {
        var metricInfo = this.metricInfo
        _.map(metrics, function(metric, metricName){
            _.extend(metric, metricInfo[metricName])
        })
        return metrics
    }


    this.get_mendeley_percent = function(metricDict, key_substring) {

        if (metricDict == undefined) {
            return 0
        }

        // values.raw holds an array of {name:<name>, value: <value>} objects.
        // this gets just ones where key_substring is a substring of <name>
        var re = new RegExp(key_substring, 'i');
        mendeleyRelevantKeys = metricDict.values.raw.filter(function(x) {return x["name"].match(re)})
        if (typeof mendeleyRelevantKeys[0] == "undefined") {
            // no students or developing countries or whatever
            return(0)
        }

        // list the percent scores for values whose names match our substring
        mendeleyPercentages = mendeleyRelevantKeys.map(function(x) {return x["value"]})
        if (typeof mendeleyPercentages[0] == "undefined") {  // not sure if this needs to be here?
            return(0)
        }

        sum = eval(mendeleyPercentages.join("+")) // dangerous, replace
        return(sum)
    }

    this.mendeley_reader_subset_count = function(metricsDict, subset_type){

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


    this.update_metric = function(metric, display_name, value) {
        metric["static_meta"]["display_name"] = display_name
        metric["values"] = {}
        metric["values"]['raw'] = value
        return(metric)
    }


    this.add_derived_metrics = function(metricsDict) {
        // mendeley student readers
        var total = this.mendeley_reader_subset_count(metricsDict, "student")
        if (total > 0) {
            var templateMetric = $.extend(true, {}, metricsDict["mendeley:readers"])
            var newMetric = this.update_metric(templateMetric,
                                              "readers: students",
                                              total)
            metricsDict["mendeley:student_readers"] = newMetric
        }

        // mendeley developing countries
        var total = this.mendeley_reader_subset_count(metricsDict, "developing_countries")
        if (total > 0) {
            var templateMetric = $.extend(true, [], metricsDict["mendeley:readers"])
            var newMetric = this.update_metric(templateMetric,
                                              "readers: developing countries",
                                              total)
            metricsDict["mendeley:developing_countries"] = newMetric
        }

        return(metricsDict)
    }

    this.getMetricPercentiles = function(metricsDict) {
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
                    }
                    else if (normRefSetName == "dryad"){
                        refSet = "Dryad"
                    }
                    metricsDict[metricName].refSet = refSet
                }
            }
        }
        return metricsDict
    }

    this.expandMetricMetadta = function(metrics, year) {
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




    this.processDict = function(dict) {
        dict.metrics = this.addMetricsInfoDataToMetrics(dict.metrics)
        dict.metrics = this.expandMetricMetadta(dict.metrics, dict.biblio.year)
        dict.metrics = this.getMetricPercentiles(dict.metrics)

        // we're not using this now, and it breaks stuff, so commenting it out...
//        dict.metrics = this.add_derived_metrics(dict.metrics)

        dict.awards = new this.makeAwardsList(dict.metrics)
        return dict
    }




    /**
     * Get item data and feed it to a callback.
     *
     * Creates items if they don't already exist, *unless* the noItemCallback arg is present.
     *
     * @id:                as [namespace, id] array.
     * @apiRoot            the api endpoint base to call
     * @successCallback    function run on success
     * @updatingCallback   function run if item is still updating its metrics (210)
     * @noItemCallback     function runs if the item doesn't exist and won't be created.
     *                     passing this function in means that missing items will *not*
     *                     be created.
     */
    this.get = function(apiRoot, apiKey, successCallback, updatingCallback, noItemCallback) {

        var thisThing = this
        var id = this.itemId
        var registerParam = (noItemCallback) ? "" : "&register=true" // defaults to true
        var url = "http://" +apiRoot+ "/v1/item/"+id[0]+'/'+ id[1] +'?key='+apiKey+registerParam
        var logIfFailedRegistration = function(data) {
            if (registerParam) {
                if (data.is_registered == false) {
                    console.log("Automatic registration failed for "+id[0]+':'+ id[1]+ ": quota reached for api key '" +apiKey+ "'. Contact team@impactstory.org to remedy.")
                }
            }}

        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            statusCode: {
                200: function(data) {
                    dict = thisThing.processDict(data)
                    thisThing.dict = dict
                    successCallback(dict, id)
                    logIfFailedRegistration(data)
                },
                210: function(data){
                    updatingCallback(data)
                    logIfFailedRegistration(data)
                },
                403: function(data) {
                    console.log("Invalid api key '" +apiKey+ "'. Contact team@impactstory.org to remedy.")                    
                    if (noItemCallback) {
                        noItemCallback(data)
                    }
                },
                404: function(data) {
                    if (noItemCallback) {
                        noItemCallback(data)
                    }
                }
            }
        });
    }

    this.create = function(apiRoot, successCallback, errorCallback){
        var apiKey = "embed" // should be a param
        var thisThing = this
        var id = this.itemId
    }


    this.init(itemData, itemView)
    return true
}





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


    this.renderBiblio = function(biblio, url) {
        var html = ""

        biblio.url = url
        biblio.title = biblio.title || "no title"
        if (biblio.create_date) {
            biblio.year = biblio.create_date.slice(0,4)
        }
        if (biblio.authors) {
            // screws up names w/ commas in them
            var auths = biblio.authors.split(",", 3).join(",") // first 3 authors
            if (auths.length < biblio.authors.length) auths += " et al."
            biblio.authors = auths
        }

        var templateName = "biblio_" + biblio.genre
        return $(ich[templateName](biblio, true))
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
                    cells: awards
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

        var awardsForRendering = _(awards).groupBy("isHighly")
        var badges$ = $(ich.badges({
               big: awardsForRendering["true"],
               any:awardsForRendering["false"]
            }), true)
        badges$.find(".ti-badge").popover({
            trigger:"hover",
            placement:"bottom"
        })
        return badges$
    }

    this.render = function(item){
        var item$ = ich.displayItem(item)

        var url = (item.aliases.url) ?  item.aliases.url[0] : false
        var biblio$ = this.renderBiblio(item.biblio, url)
        item$.find("div.biblio").append(biblio$)

        var zoom$ = this.renderZoom(item.awards, true)
        item$.find("div.zoom").append(zoom$)

        var badges$ = this.renderBadges(item.awards)
        item$.find("div.badges").append(badges$)

        return item$
    }
}


function ItemController($){
    /* Just meant to be used once, for attaching events to items.
    I think this is probably not the best way.
    * */

    this.itemReportPageInit = function() {
        // hack: clear out controls that don't work or apply
        $("#update-report-button").remove()
        $("#csv-report-button").remove()
        $("#num-items").remove()

        var myView = new ItemView($)

        var myItem = new Item([reportIdNamespace, reportId], myView, $)
        myItem.get(
            api_root,
            "item-report-page",
            this.insertRenderedItemIntoPage,
            function(data){console.log("still updating item report page")},
            function(data){alert("Sorry, this item isn't in our database yet.")}
        )


    }

    this.insertRenderedItemIntoPage = function(data) {
        var myView = new ItemView($)
        var renderedItem$ = myView.render(data)
        renderedItem$.find("div.zoom").show()

        $("<div class='genre'></div>")
            .append(renderedItem$)
            .appendTo("#metrics div.wrapper")

    }

    var body$ = $("body")

    body$.on("click", "div.item-header.zoomable", function(e){

        // follow article linkout link instead of dropping down the zoom.
        if ($(e.target).hasClass("help-text")) {
            console.log("help-text")
            return true
        }

        $(this)
           .parents("li.item")
           .find("div.zoom")
           .slideToggle(500, function(){
                            $(this).parents("li.item").toggleClass("zoomed")
                        })
        return false
        })

    body$.on("click", "a.item-help", function(){
        $("#context").modal("show")
        return false;
    })




}
