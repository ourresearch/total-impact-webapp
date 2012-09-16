//$("span.value").css("color", $.Color("#555555").transition( "#FF4E00", 0.2 ).toHexString() );

function Item(dict, itemView) {

    // [<audience>, <engagement type>, <display level>]
    var metricInfo = {
        "citeulike:bookmarks": ["scholars", "saved", "glyph"],
        "delicious:bookmarks": ["public", "saved", "glyph"],
        "dryad:most_downloaded_file": ["scholars", "viewed", "glyph"],
        "dryad:package_views": ["scholars", "viewed", "glyph"],
        "dryad:total_downloads": ["scholars", "viewed", "glyph"],
        "facebook:shares":["public", "discussed", "glyph"],
        "facebook:comments":["public", "discussed", "glyph"],
        "facebook:likes":["public", "discussed", "glyph"],
        "facebook:clicks":["public", "discussed", "glyph"],
        "github:forks":["public", "cited", "glyph"],
        "github:watchers":["public", "saved", "glyph"],
        "mendeley:career_stage":["", "", 0],
        "mendeley:country":["", "", 0],
        "mendeley:discipline":["", "", 0],
        "mendeley:student_readers":["scholars", "saved", 0],
        "mendeley:developing_countries":["scholars", "saved", 0],
        "mendeley:groups":["scholars", "saved", "glyph"],
        "mendeley:readers":["scholars", "saved", "glyph"],
        "plos:crossref": [],                    // figure it out
        "plos:html_views": [],                  // figure it out
        "plos:pdf_views": [],                   // figure it out
        "plos:pmc_abstract": ["", "", 0],
        "plos:pmc_figure": ["", "", 0],
        "plos:pmc_full-text": ["", "", 0],
        "plos:pmc_pdf": ["", "", 0],
        "plos:pmc_supp-data": ["", "", 0],
        "plos:pmc_unique-ip": ["", "", 0],
        "plos:pubmed_central": ["", "", 0],
        "plos:scopus": [],                      // figure it out
        "pubmed:f1000": ["scholars", "recommended", "glyph"],
        "pubmed:pmc_citations": ["scholars", "cited", "glyph"],
        "pubmed:pmc_citations_editorials": ["scholars", "recommended", "zoom"],
        "pubmed:pmc_citations_reviews": ["scholars", "cited", "zoom"],
        "scienceseeker:blog_posts": ["scholars", "discussed", "zoom"],
        "slideshare:comments": ["public", "discussed"],
        "slideshare:downloads": ["public", "viewed"],
        "slideshare:favorites": ["public", "saved"],
        "slideshare:views": ["public", "viewed"],
        "topsy:influential_tweets": ["public", "discussed", "zoom"],
        "topsy:tweets": ["public", "discussed", "glyph"],
        "wikipedia:mentions": ["public", "cited", "glyph"]
    }


    // developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
    // see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
    this.developing_countries = "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|Côte d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"

    this.render = function() {
        return this.itemView.render(this.dict)
    }

    this.getCellScore = function(metricsList){
        // get the highest percentileMedian from this set of metrics
        // returns 0 if no metric has a percentileMedian defined
        topMetric = metricsList.sort(function(x,y){x.percentileMedian, y.percentileMedian})[0]
        if (topMetric === undefined) {
            return 0
        }
        else {
            return topMetric.percentileMedian
        }
    }

    this.makeEngagementTable = function(dict, metricInfo){

        var engagementTable = {
            "scholars": {"viewed": [], "discussed": [], "saved": [], "cited": [], "recommended": []},
            "public": {"viewed": [], "discussed": [], "saved": [], "cited": [], "recommended": []}
        }

        // make the table
        for (var metricName in dict.metrics) {
            var display = metricInfo[metricName][2]
            if (!display) {
                continue // don't bother putting in table, we don't show it anyway
            }
            var audience = metricInfo[metricName][0]
            var engagementType = metricInfo[metricName][1]

            var metric = this.dict.metrics[metricName]
            metric.display = display

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
                    score: this.getCellScore(cell),
                    engagementType: colName,
                    audience: rowName // because mustache can't access parent context
                }
                row.cells.push(cellContents)
            }
            ret.push(row)
        }
        return {"audiences": ret}
    }

    this.makeAwards = function(engagementTable) {
        var above50obj = {}
        var activeAudiences = {}
        for (var i=0; i < engagementTable.audiences.length; i++) {
            var row = engagementTable.audiences[i]

            for (var j=0; j < row.cells.length; j++) {
                var cell = row.cells[j]

                for (var k=0; k < cell.metrics.length; k++) {
                    var metric = cell.metrics[k]

                    if (metric.percentiles !== undefined) {
                        if (metric.percentiles.CI95_lower > 50) {
                            var award = {
                                audience: row.audience,
                                engagementType:cell.engagementType,
                                metric: metric
                            }
                            // hack so we don't have multiple awards per table cell
                            above50obj[award.audience+award.engagementType] = award
                        }
                    }

                    // see if it has *any* activity
                    if (metric.values.raw) {
                        activeAudiences[row.audience] = true
                    }
                }

            }
        }

        above50Arr = []
        for (k in above50obj) {
            above50Arr.push(above50obj[k])
        }

        activeAudiencesArr = []
        for (var audienceName in activeAudiences){
            activeAudiencesArr.push(audienceName)
        }

        return {
            above50: above50Arr,
            activeAudiences: activeAudiencesArr
        }
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

    this.getMetricPercentiles = function(metricsDict, normRefSetName) {
        for (var metricName in metricsDict) {
            metricsDict[metricName].percentiles = metricsDict[metricName].values[normRefSetName]
        }
        return metricsDict
    }

    this.fixPlosMetricName = function(metricsDict) {
        // sometime plos metrics have "plos:" in front, sometimes "plosalm:". ick.
        for(var metricName in metricsDict){
            if (metricName.indexOf("plos") === 0) {
                var newKey = metricName.replace("plos:", "plosalm:")
                metricsDict[newKey] = metricsDict[metricName]
                delete metricsDict[metricName]
            }
        }
        return metricsDict
    }






    // constructor
    this.dict = dict
    this.dict.metrics = this.getMetricPercentiles(this.dict.metrics, "nih")
    this.dict.metrics = this.fixPlosMetricName(this.dict.metrics)
    this.dict.metrics = this.add_derived_metrics(this.dict.metrics)
    this.dict.engagementTable = this.makeEngagementTable(this.dict, metricInfo)
    this.dict.awards = this.makeAwards(dict.engagementTable)

    this.itemView = itemView


    return true
}














function ItemView() {

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




    this.renderBiblio = function(biblio, awards, url) {
        var html = ""

        biblio.url = url
        biblio.above50 = awards.above50
        biblio.activeAudiences = awards.activeAudiences.join(" ")
        biblio.title = biblio.title || "no title"
        if (biblio.create_date) {
            biblio.year = biblio.create_date.slice(0,4)
        }

        var templateName = "biblio_" + biblio.genre
        return $(ich[templateName](biblio, true))
    }

    this.renderGlyph = function(engagementTable){
        var glyph$ = $(ich["glyphTemplate"](engagementTable, true))
        glyph$.find("li.glyph-cell span.value").each(function(){
            var myHeight = $(this).text()
            $(this).css("height", (myHeight) +"%")
        })
        return glyph$
    }

    this.findBarLabelOffsets = function(start, end) {
        var maxWidth = 20
        // fix the numbers overlapping when the range is too narrow
        //only works on the ends...not ideal
        var startNumberOffset = 0
        if (startValue - 80 > 0) var startNumberOffset = (startValue - 80) * -1

        var endNumberOffset = 0
        if (20 - endValue >  0) var endNumberOffset = (10 - endValue) * -1
    }


    this.renderZoom = function(engagementTable) {
        var zoom$ = $(ich.zoomTable(engagementTable, true))
        zoom$.find("div.metric-perc-range.ci").each(function(){

            // where does the bar go?
            var ciStartValue = $(this).find("span.endpoint.start span.value").text()
            var ciEndValue = $(this).find("span.endpoint.end span.value").text()

            $(this).css(
                {
                    "margin-left":ciStartValue+"%",
                    "margin-right":(100 - ciEndValue)+"%"
                })
                .find("span.endpoint.start").css("left", 0+"px")
                .end()
                .find("span.endpoint.end").css("right", 0+"px")
        })
        return zoom$
    }

    this.render = function(item){
        var item$ = ich.displayItem(item)

        var glyph$ = this.renderGlyph(item.engagementTable, true)
        item$.find("div.glyph").append(glyph$)

        var url = (item.aliases.url) ?  item.aliases.url[0] : false
        var biblio$ = this.renderBiblio(item.biblio, item.awards, url)
        item$.find("div.biblio").append(biblio$)

        var zoom$ = this.renderZoom(item.engagementTable, true)
        item$.find("div.zoom").append(zoom$).hide()

        item$.hover(
            function(){
//                $(this).find("a.item-delete-button").fadeIn("fast");
            },
            function(){
//                $(this).find("a.item-delete-button").fadeOut("fast");
            }
        )

        item$.find("a.item-delete-button").click(function(){
            var tiid = $(this).parent().id
            console.log("this is where I would delete "+tiid)
            return false
        })

        item$.find("div.glyph, div.biblio").click(function(){
            $(this)
                .siblings("div.zoom")
                .slideToggle(500, function(){
                                             $(this).parents("li.item").toggleClass("zoomed")
                                         })
                .end()
                .find("a.item-delete-button").fadeToggle(500)
        })

        return item$
    }
}


function ItemController(item, itemView){

}
