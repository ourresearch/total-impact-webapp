
function Item(dict, itemView) {

    this.dict = dict
    this.itemView = itemView

    this.render = function() {
        console.log("here is the item I've got:");
        console.log(this.dict)
        return this.itemView.render(dict)
    }
    return true
}

function ItemView() {

    // developing countries as per IMF 2012, plus Cuba and North Korea (not IMF members)
    // see http://www.imf.org/external/pubs/ft/weo/2012/01/pdf/text.pdf
    this.developing_countries = "Afghanistan|Albania|Algeria|Angola|Antigua and Barbuda|Argentina|Armenia|Azerbaijan|Bahamas|Bahrain|Bangladesh|Barbados|Belarus|Belize|Benin|Bhutan|Bolivia|Bosnia and Herzegovina|Botswana|Brazil|Brunei|Bulgaria|Burkina Faso|Burma|Burundi|Cambodia|Cameroon|Cape Verde|Central African Republic|Chad|Chile|China|Colombia|Comoros|Cuba|Democratic Republic of the Congo|Republic of the Congo|Costa Rica|Côte d Ivoire|Croatia|Djibouti|Dominica|Dominican Republic|Ecuador|Egypt|El Salvador|Equatorial Guinea|Eritrea|Ethiopia|Fiji|Gabon|The Gambia|Georgia|Ghana|Grenada|Guatemala|Guinea|Guinea-Bissau|Guyana|Haiti|Honduras|Hungary|India|Indonesia|Iran|Iraq|Jamaica|Jordan|Kazakhstan|Kenya|Kiribati|Kuwait|Kyrgyzstan|Laos|Latvia|Lebanon|Lesotho|Liberia|Libya|Lithuania|Macedonia|Madagascar|Malawi|Malaysia|Maldives|Mali|Marshall Islands|Mauritania|Mauritius|Mexico|Federated States of Micronesia|Moldova|Mongolia|Montenegro|Morocco|Mozambique|Namibia|Nauru|Nepal|Nicaragua|Niger|Nigeria|North Korea|Oman|Pakistan|Palau|Panama|Papua New Guinea|Paraguay|Peru|Philippines|Poland|Qatar|Romania|Russia|Rwanda|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|São Tomé and Príncipe|Saudi Arabia|Senegal|Serbia|Seychelles|Sierra Leone|Solomon Islands|Somalia|South Africa|South Sudan|Sri Lanka|Sudan|Suriname|Swaziland|Syria|Tajikistan|Tanzania|Thailand|Timor-Leste|Togo|Tonga|Trinidad and Tobago|Tunisia|Turkey|Turkmenistan|Tuvalu|Uganda|Ukraine|United Arab Emirates|Uruguay|Uzbekistan|Vanuatu|Venezuela|Vietnam|Yemen|Zambia|Zimbabwe"

    this.showHideExtraMetrics = function(item$) {
        var numMetrics = item$.find("ul.metrics li").length
        var extraMetrics = (11 - numMetrics) * -1
        if (extraMetrics > 0) {
            $("<a class='showhide'>+"+extraMetrics+" more...</a>")
                .click(function() {
                           $(this).hide().prev().find("li").show()
                       })
                .insertAfter(item$.find("ul.metrics"))
            item$.find("li:gt(10)").hide()

        }
    }

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


    this.get_mendeley_percent = function(metricsArr, dict_key, key_substring) {
        mendeleyRelevantDict = metricsArr.filter(function(x) {return x["name"]==dict_key})
        if (typeof mendeleyRelevantDict[0] == "undefined") {
            return(0)
        }

        var re = new RegExp(key_substring, 'i');
        mendeleyRelevantKeys = mendeleyRelevantDict[0].value.filter(function(x) {return x["name"].match(re)})
        if (typeof mendeleyRelevantKeys[0] == "undefined") {
            return(0)
        }

        mendeleyPercentages = mendeleyRelevantKeys.map(function(x) {return x["value"]})
        if (typeof mendeleyPercentages[0] == "undefined") {
            return(0)
        }

        sum = eval(mendeleyPercentages.join("+"))
        return(sum)
    }

    this.mendeley_reader_subset_count = function(metricsArr, subset_type){
        mendeleyReaders = metricsArr.filter(function(x) {return x["name"]=="mendeley:readers"})
        if (typeof mendeleyReaders[0] == "undefined") {
            return(0)
        }
        total_mendeley_readers = mendeleyReaders[0].value

        if (subset_type == "student") {
            percent = this.get_mendeley_percent(metricsArr, "mendeley:career_stage", "student")
        }
        if (subset_type == "developing_countries") {
            percent = this.get_mendeley_percent(metricsArr, "mendeley:country", this.developing_countries)
        }

        total = Math.round(total_mendeley_readers * percent / 100)
        console.log(total_mendeley_readers + " mendeley readers * " + percent + "% " + subset_type + " = " + total)

        return(total)
    }

    this.get_copy_of_mendeley_item = function(metricsArr) {
        // do a deep copy
        mendeleyReaders = metricsArr.filter(function(x) {return x["name"]=="mendeley:readers"})
        copyMendeleyReaders = $.extend(true, [], mendeleyReaders[0]);
        return(copyMendeleyReaders)
    }

    this.update_metric = function(item, metric_name, display_name, value) {
        item["name"] = metric_name
        item["static_meta"]["display_name"] = display_name
        item["value"] = value
        return(item)
    }

    this.add_derived_metrics = function(metricsArr) {
        // mendeley student readers
        total = this.mendeley_reader_subset_count(metricsArr, "student")
        if (total > 0) {
            mendeleyItem = this.get_copy_of_mendeley_item(metricsArr)
            mendeleyItem = this.update_metric(mendeleyItem,
                                              "mendeley:student_readers",
                                              "readers: students",
                                              total)
            metricsArr.push(mendeleyItem)
        }

        // mendeley developing countries
        total = this.mendeley_reader_subset_count(metricsArr, "developing_countries")
        if (total > 0) {
            mendeleyItem = this.get_copy_of_mendeley_item(metricsArr)
            mendeleyItem = this.update_metric(mendeleyItem,
                                              "mendeley:developing_countries",
                                              "readers: developing countries",
                                              total)
            metricsArr.push(mendeleyItem)
        }

        return(metricsArr)
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
        item.metricsArr = []
        for (metricName in item.metrics){
            thisMetric = item.metrics[metricName]
            thisMetric.name = metricName
            thisMetric.value = item.metrics[metricName]["values"]["raw"]

            // for now, hardcode we only have normed values for articles
            if (item.biblio.genre == "article") {
                if (typeof item.metrics[metricName]["values"]["nih"] != "undefined") {

                    // for now, hardcode only have one norm called nih
                    thisMetric.norm = item.metrics[metricName]["values"]["nih"]
                    thisMetric.value = thisMetric.value + " [" + thisMetric.norm + "]"
                }
            }


            // if no values, no point in printing
            if (thisMetric.value) {
                item.metricsArr.push(thisMetric)
            }
        }

        // add on the derived metrics
        if (typeof item.metricsArr[0] != "undefined") {
            item.metricsArr = this.add_derived_metrics(item.metricsArr)
        }

        // remove the dictionaries from what will be displayed
        item.metricsArr = item.metricsArr.filter(function(x) {
            good_to_print = (typeof x["value"] == "number")
            if (typeof x["value"] == "string") {
                good_to_print = true
            }
            if (typeof x["norm"] != "undefined") {
                good_to_print = true
            }            
            return good_to_print
        })

        // sort by descending order of metrics
        item.metricsArr.sort(this.sortByMetricValueDesc)

        var url = (item.aliases.url) ?  item.aliases.url[0] : false
        var html$ = ich.item(item)
        this.showHideExtraMetrics(html$)
        var biblioHtml = this.renderBiblio(item.biblio, url)

        // show/hide the delete-item button.
        html$.find("div.biblio").append(biblioHtml)
            .hover(
            function(){
//                $(this).find("a.item-delete-button").fadeIn("fast");
            },
            function(){
//                $(this).find("a.item-delete-button").fadeOut("fast");
            }
        )

        // setup the delete-item button
        html$.find("a.item-delete-button").click(function(){
            var tiid = $(this).parent().parent().attr("id")
            console.log("this is where I would delete "+tiid)
        })

        return html$
    }
}


function ItemController(item, itemView){

}
