

function Item(itemData, itemView, $) {

    // [<audience>, <engagement type>, <display level>]
    // display levels: 0 (like it says), "zoom" (only in zoom), "badge" (zoom, + gets badges)
    var metricInfo = {
        "citeulike:bookmarks": ["scholars", "saved", "badge", 3],
        "delicious:bookmarks": ["public", "saved", "badge", 3],
        "dryad:most_downloaded_file": ["", "", 0],
        "dryad:package_views": ["scholars", "viewed", "badge", 3],
        "dryad:total_downloads": ["scholars", "viewed", "badge", 3],
        "figshare:views": ["scholars", "viewed", "badge", 3],
        "figshare:downloads": ["scholars", "viewed", "badge", 3],
        "figshare:shares": ["scholars", "discussed", "badge", 3],
        "facebook:shares":["public", "discussed", "badge", 3],
        "facebook:comments":["public", "discussed", "badge", 3],
        "facebook:likes":["public", "discussed", "badge", 3],
        "facebook:clicks":["public", "discussed", "badge", 3],
        "github:forks":["public", "cited", "badge", 3],
        "github:watchers":["public", "saved", "badge", 3],
        "mendeley:career_stage":["", "", 0, 0],
        "mendeley:country":["", "", 0, 0],
        "mendeley:discipline":["", "", 0, 0],
        "mendeley:student_readers":["scholars", "saved", 0, 0],
        "mendeley:developing_countries":["scholars", "saved", 0, 0],
        "mendeley:groups":["", "", 0, 0],
        "mendeley:readers":["scholars", "saved", "badge", 3],
        "pmc:pdf_downloads":["", "", 0, 0],
        "pmc:abstract_views":["", "", 0, 0],
        "pmc:fulltext_views":["", "", 0, 0],
        "pmc:unique_ip_views":["", "", 0, 0],
        "pmc:figure_views":["", "", 0, 0],
        "pmc:suppdata_views":["", "", 0, 0],
        "plosalm:crossref": [],                    // figure it out
        "plosalm:html_views": ["public", "viewed", "badge", 3],
        "plosalm:pdf_views": ["scholars", "viewed", "badge", 3],
        "plosalm:pmc_abstract": ["", "", 0],
        "plosalm:pmc_figure": ["", "", 0],
        "plosalm:pmc_full-text": ["", "", 0],
        "plosalm:pmc_pdf": ["", "", 0],
        "plosalm:pmc_supp-data": ["", "", 0],
        "plosalm:pmc_unique-ip": ["", "", 0],
        "plosalm:pubmed_central": ["", "", 0],
        "plosalm:scopus": [],                      // figure it out
        "pubmed:f1000": ["scholars", "recommended", "badge", 1],
        "pubmed:pmc_citations": ["scholars", "cited", 0, 0],
        "pubmed:pmc_citations_editorials": ["scholars", "recommended", 0, 0],
        "pubmed:pmc_citations_reviews": ["scholars", "cited", 0, 0],
        "scienceseeker:blog_posts": ["scholars", "discussed", "badge", 0],
        "scopus:citations": ["scholars", "cited", "badge", 3],
        "researchblogging:blogs": ["scholars", "discussed", 0, 0],
        "slideshare:comments": ["public", "discussed", "badge", 3],
        "slideshare:downloads": ["public", "viewed", "badge", 3],
        "slideshare:favorites": ["public", "recommended", "badge", 3],
        "slideshare:views": ["public", "viewed", "badge", 3],
        "topsy:influential_tweets": ["public", "discussed", "zoom", 0],
        "topsy:tweets": ["public", "discussed", "badge", 3],
        "wikipedia:mentions": ["public", "cited", "badge", 1]
    }


    // developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
    // see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
    this.developing_countries = "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|Côte d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"

    this.render = function() {
        return this.itemView.render(this.dict)
    }



    this.makeEngagementTable = function(dict, metricInfo){

        var engagementTable = {
            "scholars": {"viewed": [], "discussed": [], "saved": [], "cited": [], "recommended": []},
            "public": {"viewed": [], "discussed": [], "saved": [], "cited": [], "recommended": []}
        }

        var engagementTypeNouns = {
            "viewed":"views",
            "discussed": "discussion",
            "saved": "saves",
            "cited": "citation",
            "recommended": "recommendation"
        }

        // make the table
        for (var metricName in dict.metrics) {
            var display = metricInfo[metricName][2]
            if (!display) {
                continue // don't bother putting in table, we don't show it anyway
            }
            var audience = metricInfo[metricName][0]
            var engagementType = metricInfo[metricName][1]

            var metric = dict.metrics[metricName]
            metric.display = display
            metric.minNumForAward = metricInfo[metricName][3]

            engagementTable[audience][engagementType].push(metric)
        }

        // convert the engagement table from a nested hashes to nested arrays
        // mostly because mustache.js needs it this way. should probably break this
        // but out as a method.
        ret = []
        for (var rowName in engagementTable) {
            var row = {audience: rowName, cells: [] }
            for (colName in engagementTable[rowName]) {
                var cell = engagementTable[rowName][colName]

                if (!cell.length) continue // we don't do anything with empty cells

                cellContents = {
                    metrics: cell,
                    engagementType: colName,
                    engagementTypeNoun: engagementTypeNouns[colName],
                    audience: rowName // because mustache can't access parent context
                }
                row.cells.push(cellContents)
            }
            ret.push(row)
        }
        return {"audiences": ret}
    }

    this.objToArr = function(obj){
        var arr = []
        for (k in obj) {
            arr.push(obj[k])
        }
        return arr
    }

    // returns a copy of obj1, minus the keys it shares with obj2
    this.subractKeys = function(obj1, obj2) {
        var newObj1 = {}
        for (k in obj1) {
            if (!(k in obj2)) {
                newObj1[k] = obj1[k]
            }
        }
        return newObj1
    }

    this.getsBigAward = function(raw, minForAward, lowerBound) {

        if (lowerBound >= 75 && raw >= minForAward) {
                return true
        }
        else if (raw === "Yes") { // hack for F1000
            return true
        }
        else {
            return false
        }
    }

    this.makeAwards = function(engagementTable) {
        var any = {}
        var big = {}
        for (var i=0; i < engagementTable.audiences.length; i++) {
            var row = engagementTable.audiences[i]

            for (var j=0; j < row.cells.length; j++) {
                var cell = row.cells[j]

                for (var k=0; k < cell.metrics.length; k++) {
                    var metric = cell.metrics[k]
                    var cellName = row.audience+"."+cell.engagementType
                    var raw = metric.values.raw
                    var minForAward = metric.minNumForAward

                    if (metric.values.raw && metric.display=="badge") {

                        // add a big badge if we can
                        if (metric.percentiles !== undefined) {
                            var lowerBound = metric.percentiles.CI95_lower
                            if (this.getsBigAward(raw, minForAward, lowerBound) ) {
                                big[cellName] = {
                                    audience: cell.audience,
                                    engagementType: cell.engagementType,
                                    minForAward: metric.minNumForAward,
                                    engagementTypeNoun: cell.engagementTypeNoun,
                                    metric: metric
                                }
                            }
                        }

                        // quit if there's a big badge; can't improve on that.
                        if (cellName in big) {
                            continue
                        }

                        // finally, assign a lil badge
                        any[cellName] = {
                            audience: row.audience,
                            engagementType:cell.engagementType,
                            metric: metric
                        }
                    }
                }
            }
        }

        any = this.subractKeys(any, big)

        return {
            any: this.objToArr(any),
            big: this.objToArr(big)
        }
    }

    this.hasAwards = function() {
        return this.dict.awards.any.length || this.dict.awards.big.length
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
                }
            }
        }
        return metricsDict
    }

    /**
     * Get item data and feed it to a callback.
     *
     * @id:                as [namespace, id] array.
     * @apiRoot            the api endpoint base to call
     * @successCallback    function run on success
     * @errorCallback      function run on error
     */
    this.get = function(apiRoot, apiKey, successCallback, errorCallback) {
        var thisThing = this
        var id = this.itemId
        $.ajax({
            url: "http://" +apiRoot+ "/v1/item/"+id[0]+'/'+ id[1] +'?key='+apiKey,
            type: "GET",
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(data) {
                dict = thisThing.processDict(data)
                thisThing.dict = dict
                successCallback(dict, id)
            },
            error: function(data) {
                console.log("fail!")
            }
        });
    }

    this.create = function(apiRoot, successCallback, errorCallback){
        var apiKey = "embed" // should be a param
        var thisThing = this
        var id = this.itemId
    }

    this.processDict = function(dict) {
        dict.metrics = this.getMetricPercentiles(dict.metrics)
        console.log(dict.biblio.title)

        dict.metrics = this.add_derived_metrics(dict.metrics)
        dict.engagementTable = this.makeEngagementTable(dict, metricInfo)

        dict.awards = this.makeAwards(dict.engagementTable)

        return dict
    }



    // constructor
    this.itemView = itemView

    if (itemData.hasOwnProperty("_id")) {
        this.dict = this.processDict(itemData)
    }
    // we've created this item with an id instead of a data object;
    else {
        console.log("building an Item object with this id: " + itemData[0] + "/" + itemData[1])
        this.dict = false
        this.itemId = itemData
    }

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


    this.renderZoom = function(engagementTable) {
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

    this.renderBadges = function(awards, extraClasses) {
        var badges$ = $(ich.badges({
               big: awards.big,
               any:awards.any
            }), true)
        badges$.find(".ti-badge").addClass(extraClasses).tooltip()
        return badges$
    }

    this.render = function(item){
        var item$ = ich.displayItem(item)

        var url = (item.aliases.url) ?  item.aliases.url[0] : false
        var biblio$ = this.renderBiblio(item.biblio, url)
        item$.find("div.biblio").append(biblio$)

        var zoom$ = this.renderZoom(item.engagementTable, true)
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
        $("#num-items").remove()

        var myView = new ItemView($)
        var idArr = reportId.split(/\/(.+)/, 2) // split on first slash

        var myItem = new Item(idArr, myView, $)
        myItem.get(api_root, "item-report-page", this.insertRenderedItemIntoPage)


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
