
function Item(dict, itemView) {

    // [<audience>, <engagement type>, <display level>]
    var metricInfo = {
        "citeulike:bookmarks": ["scholarly", "save", "glyph"],
        "delicious:bookmarks": ["general", "save", "glyph"],
        "dryad:most_downloaded_file": ["scholarly", "read", "glyph"],
        "dryad:package_views": ["scholarly", "read", "glyph"],
        "dryad:total_downloads": ["scholarly", "read", "glyph"],
        "facebook:shares":["general", "converse", "glyph"],
        "facebook:comments":["general", "converse", "glyph"],
        "facebook:likes":["general", "converse", "glyph"],
        "facebook:clicks":["general", "converse", "glyph"],
        "github:forks":["general", "use", "glyph"],
        "github:watchers":["general", "save", "glyph"],
        "mendeley:career_stage":["", "", 0],
        "mendeley:country":["", "", 0],
        "mendeley:discipline":["", "", 0],
        "mendeley:student_readers":["scholarly", "save", "zoom"],
        "mendeley:developing_countries":["scholarly", "save", "zoom"],
        "mendeley:groups":["scholarly", "save", "glyph"],
        "mendeley:readers":["scholarly", "save", "glyph"],
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
        "pubmed:f1000": ["scholarly", "recommend", "glyph"],
        "pubmed:pmc_citations": ["scholarly", "use", "glyph"],
        "pubmed:pmc_citations_editorials": ["scholarly", "recommend", "zoom"],
        "pubmed:pmc_citations_reviews": ["scholarly", "use", "zoom"],
        "slideshare:comments": ["general", "converse"],
        "slideshare:downloads": ["general", "read"],
        "slideshare:favorites": ["general", "save"],
        "slideshare:views": ["general", "read"],
        "topsy:influential_tweets": ["general", "converse", "zoom"],
        "topsy:tweets": ["general", "converse", "glyph"],
        "wikipedia:mentions": ["general", "use", "glyph"]
    }


    // developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
    // see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
    this.developing_countries = "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|Côte d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"

    this.render = function() {
        return this.itemView.render(this.dict)
    }

    this.makeEngagementTable = function(dict, metricInfo){
        var engagementTable = {
            "general":{"read":[], "converse":[], "save":[], "use":[], "recommend":[]},
            "scholarly":{"read":[], "converse":[], "save":[], "use":[], "recommend":[]}
        }
        for (var metricName in dict.metrics) {
            var display = metricInfo[metricName][2]
            if (!display) {
                continue // don't bother putting in table, we don't show it anyway
            }
            var audience = metricInfo[metricName][0]
            var engagementType = metricInfo[metricName][1]

            metric = this.dict.metrics[metricName]
            metric.display = display
            engagementTable[audience][engagementType].push(metric)
        }

        return engagementTable
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
    this.dict.metrics = this.fixPlosMetricName(this.dict.metrics)
    this.dict.metrics = this.add_derived_metrics(this.dict.metrics)
    this.dict.engagementTable = this.makeEngagementTable(this.dict, metricInfo)
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

    this.formatEngagementTableForMustache = function(table) {
        // converts from nested objs to nested arrays

        ret = []
        for (var rowName in table) {
            var row = {name: rowName, cells: [] }
            for (colName in table[rowName]) {
                var cell = table[rowName][colName]
                row.cells.push({metrics: cell})
            }
            ret.push(row)
        }
        return {"rows": ret}
    }


    this.renderBiblio = function(biblio, url) {
        var html = ""

        biblio.url = url
        biblio.title = biblio.title || "no title"
        if (biblio.create_date) {
            biblio.year = biblio.create_date.slice(0,4)
        }

        var templateName = "biblio_" + biblio.genre
        return ich[templateName](biblio, true)
    }

    this.render = function(item){
        var item$ = ich.displayItem(item)

        // make the zoom table
        convertedTable = this.formatEngagementTableForMustache(item.engagementTable)
        console.log("here's the converted table: ")
        console.log(convertedTable)

        zoomHtml = ich.zoomTable(convertedTable, true)
        item$.find("div.zoom").append(zoomHtml)


        // take care of biblio
        var url = (item.aliases.url) ?  item.aliases.url[0] : false
        var biblioHtml = this.renderBiblio(item.biblio, url)

        // show/hide the delete-item button.
        item$.find("div.biblio").append(biblioHtml)
            .hover(
            function(){
//                $(this).find("a.item-delete-button").fadeIn("fast");
            },
            function(){
//                $(this).find("a.item-delete-button").fadeOut("fast");
            }
        )

        // setup the delete-item button
        item$.find("a.item-delete-button").click(function(){
            var tiid = $(this).parent().parent().attr("id")
            console.log("this is where I would delete "+tiid)
        })

        return item$
    }
}


function ItemController(item, itemView){

}
