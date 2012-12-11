(function(){var q=function(){function c(a){return(""+a).replace(/&(?!\w+;)|[<>"']/g,function(a){return k[a]||a})}var e=Object.prototype.toString;Array.isArray=Array.isArray||function(a){return"[object Array]"==e.call(a)};var i=String.prototype.trim,g;if(i)g=function(a){return null==a?"":i.call(a)};else{var h,m;/\S/.test("\u00a0")?(h=/^[\s\xA0]+/,m=/[\s\xA0]+$/):(h=/^\s+/,m=/\s+$/);g=function(a){return null==a?"":a.toString().replace(h,"").replace(m,"")}}var k={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;",
    "'":"&#39;"},o={},p=function(){};p.prototype={otag:"{{",ctag:"}}",pragmas:{},buffer:[],pragmas_implemented:{"IMPLICIT-ITERATOR":!0},context:{},render:function(a,d,b,f){if(!f)this.context=d,this.buffer=[];if(this.includes("",a)){var a=this.render_pragmas(a),j=this.render_section(a,d,b);!1===j&&(j=this.render_tags(a,d,b,f));if(f)return j;this.sendLines(j)}else{if(f)return a;this.send(a)}},send:function(a){""!==a&&this.buffer.push(a)},sendLines:function(a){if(a)for(var a=a.split("\n"),d=0;d<a.length;d++)this.send(a[d])},
    render_pragmas:function(a){if(!this.includes("%",a))return a;var d=this,b=this.getCachedRegex("render_pragmas",function(a,d){return RegExp(a+"%([\\w-]+) ?([\\w]+=[\\w]+)?"+d,"g")});return a.replace(b,function(a,b,e){if(!d.pragmas_implemented[b])throw{message:"This implementation of mustache doesn't understand the '"+b+"' pragma"};d.pragmas[b]={};e&&(a=e.split("="),d.pragmas[b][a[0]]=a[1]);return""})},render_partial:function(a,d,b){a=g(a);if(!b||void 0===b[a])throw{message:"unknown_partial '"+a+"'"};
        return!d||"object"!=typeof d[a]?this.render(b[a],d,b,!0):this.render(b[a],d[a],b,!0)},render_section:function(a,d,b){if(!this.includes("#",a)&&!this.includes("^",a))return!1;var f=this,j=this.getCachedRegex("render_section",function(a,b){return RegExp("^([\\s\\S]*?)"+a+"(\\^|\\#)\\s*(.+)\\s*"+b+"\n*([\\s\\S]*?)"+a+"\\/\\s*\\3\\s*"+b+"\\s*([\\s\\S]*)$","g")});return a.replace(j,function(a,j,e,c,g,h){var a=j?f.render_tags(j,d,b,!0):"",h=h?f.render(h,d,b,!0):"",n,c=f.find(c,d);"^"===e?n=!c||Array.isArray(c)&&
        0===c.length?f.render(g,d,b,!0):"":"#"===e&&(n=Array.isArray(c)?f.map(c,function(a){return f.render(g,f.create_context(a),b,!0)}).join(""):f.is_object(c)?f.render(g,f.create_context(c),b,!0):"function"==typeof c?c.call(d,g,function(a){return f.render(a,d,b,!0)}):c?f.render(g,d,b,!0):"");return a+n+h})},render_tags:function(a,d,b,f){for(var j=this,e=function(){return j.getCachedRegex("render_tags",function(a,b){return RegExp(a+"(=|!|>|&|\\{|%)?([^#\\^]+?)\\1?"+b+"+","g")})},g=e(),h=function(a,f,h){switch(f){case "!":return"";
        case "=":return j.set_delimiters(h),g=e(),"";case ">":return j.render_partial(h,d,b);case "{":case "&":return j.find(h,d);default:return c(j.find(h,d))}},a=a.split("\n"),i=0;i<a.length;i++)a[i]=a[i].replace(g,h,this),f||this.send(a[i]);if(f)return a.join("\n")},set_delimiters:function(a){a=a.split(" ");this.otag=this.escape_regex(a[0]);this.ctag=this.escape_regex(a[1])},escape_regex:function(a){if(!arguments.callee.sRE)arguments.callee.sRE=RegExp("(\\/|\\.|\\*|\\+|\\?|\\||\\(|\\)|\\[|\\]|\\{|\\}|\\\\)",
                                                                                                                                                                                                                                                                                                                                                                                                                                                                           "g");return a.replace(arguments.callee.sRE,"\\$1")},find:function(a,d){function b(a){return!1===a||0===a||a}var a=g(a),f;if(a.match(/([a-z_]+)\./ig)){var c=this.walk_context(a,d);b(c)&&(f=c)}else b(d[a])?f=d[a]:b(this.context[a])&&(f=this.context[a]);return"function"==typeof f?f.apply(d):void 0!==f?f:""},walk_context:function(a,d){for(var b=a.split("."),f=void 0!=d[b[0]]?d:this.context,c=f[b.shift()];void 0!=c&&0<b.length;)f=c,c=c[b.shift()];return"function"==typeof c?c.apply(f):c},includes:function(a,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    d){return-1!=d.indexOf(this.otag+a)},create_context:function(a){if(this.is_object(a))return a;var d=".";if(this.pragmas["IMPLICIT-ITERATOR"])d=this.pragmas["IMPLICIT-ITERATOR"].iterator;var b={};b[d]=a;return b},is_object:function(a){return a&&"object"==typeof a},map:function(a,d){if("function"==typeof a.map)return a.map(d);for(var b=[],c=a.length,e=0;e<c;e++)b.push(d(a[e]));return b},getCachedRegex:function(a,d){var b=o[this.otag];b||(b=o[this.otag]={});var c=b[this.ctag];c||(c=b[this.ctag]={});
        (b=c[a])||(b=c[a]=d(this.otag,this.ctag));return b}};return{name:"mustache.js",version:"0.4.0",to_html:function(a,c,b,f){var e=new p;if(f)e.send=f;e.render(a,c||{},b);if(!f)return e.buffer.join("\n")}}}();(function(){var c={VERSION:"0.10",templates:{},$:"undefined"!==typeof window?window.jQuery||window.Zepto||null:null,addTemplate:function(e,i){if("object"===typeof e)for(var g in e)this.addTemplate(g,e[g]);else c[e]?console.error("Invalid name: "+e+"."):c.templates[e]?console.error('Template "'+e+
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   '  " exists'):(c.templates[e]=i,c[e]=function(g,i){var g=g||{},k=q.to_html(c.templates[e],g,c.templates);return c.$&&!i?c.$(k):k})},clearAll:function(){for(var e in c.templates)delete c[e];c.templates={}},refresh:function(){c.clearAll();c.grabTemplates()},grabTemplates:function(){var e,i=document.getElementsByTagName("script"),g,h=[];for(e=0,l=i.length;e<l;e++)if((g=i[e])&&g.innerHTML&&g.id&&("text/html"===g.type||"text/x-icanhaz"===g.type))c.addTemplate(g.id,"".trim?g.innerHTML.trim():g.innerHTML.replace(/^\s+/,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "").replace(/\s+$/,"")),h.unshift(g);for(e=0,l=h.length;e<l;e++)h[e].parentNode.removeChild(h[e])}};"undefined"!==typeof require?module.exports=c:window.ich=c;"undefined"!==typeof document&&(c.$?c.$(function(){c.grabTemplates()}):document.addEventListener("DOMContentLoaded",function(){c.grabTemplates()},!0))})()})();


(function () {
    var webappRoot = "{{ webapp_root }}";
    var apiRoot = "{{ api_root }}"

//    var webappRoot = "impactstory.org" // for testing cross-domain stuff


    /******** Load jQuery if not present *********/
    var jQuery;
    // this embed pattern is from http://alexmarandon.com/articles/web_widget_jquery/
    if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.4.2') {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");
        script_tag.setAttribute("src",
                                "https://ajax.googleapis.com/ajax/libs/jquery/1.7.0/jquery.min.js");
        if (script_tag.readyState) {
            script_tag.onreadystatechange = function () { // For old versions of IE
                if (this.readyState == 'complete' || this.readyState == 'loaded') {
                    scriptLoadHandler();
                }
            };
        } else {
            script_tag.onload = scriptLoadHandler;
        }
        // Try to find the head, otherwise default to the documentElement
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    } else {
        // The jQuery version on the window is the one we want to use
        jQuery = window.jQuery;
        main();
    }


    /******** Called once jQuery has loaded ******/
    function scriptLoadHandler() {
        // Restore $ and window.jQuery to their previous values and store the
        // new jQuery in our local jQuery variable
        jQuery = window.jQuery.noConflict(true);
        // Call our main function
        main();
    }


    /******** utility functions ******/

        // Based on http://drnicwilliams.com/2006/11/21/diy-widgets/
    function requestStylesheet(stylesheet_url) {
        var stylesheet = document.createElement("link");
        stylesheet.rel = "stylesheet";
        stylesheet.type = "text/css";
        stylesheet.href = stylesheet_url;
        stylesheet.media = "all";
        document.lastChild.firstChild.appendChild(stylesheet);
    }


    // Based on the Load jQuery function above.
    function requestScript(script_url) {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type", "text/javascript");

        script_tag.setAttribute("src", script_url);
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag)
    }


    /******** ImpactStory functions ******/

    function loadBadgesTemplate(webAppRoot, callback) {
        jQuery.ajax({
            url:"http://" + webAppRoot + "/embed/templates/badges.html",
            type:"GET",
            success: function(data){
                ich.addTemplate("badges", data)
                // do callback stuff...not messing with it for now.
            }
        })
    }

    function getWindowCallback(div$, dict){
        callbackName = div$.attr("data-on-finish")
        if (callbackName) {
            window[callbackName].call(window, dict, div$)
        }
        else {
            // just a stub, doesn't do anything.
            return true
        }

    }




    /******** Our main function ********/

    function main() {
        var $ = jQuery
        $.support.cors = true;




        /* ===========================================================
         * bootstrap-tooltip.js v2.1.1
         * http://twitter.github.com/bootstrap/javascript.html#tooltips
         * Inspired by the original jQuery.tipsy by Jason Frame
         * ===========================================================
         * Copyright 2012 Twitter, Inc.
         *
         * Licensed under the Apache License, Version 2.0 (the "License");
         * you may not use this file except in compliance with the License.
         * You may obtain a copy of the License at
         *
         * http://www.apache.org/licenses/LICENSE-2.0
         *
         * Unless required by applicable law or agreed to in writing, software
         * distributed under the License is distributed on an "AS IS" BASIS,
         * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
         * See the License for the specific language governing permissions and
         * limitations under the License.
         * ========================================================== */
        "use strict";var Tooltip=function(b,a){this.init("tooltip",b,a)};Tooltip.prototype={constructor:Tooltip,init:function(d,c,b){var e,a;this.type=d;this.$element=$(c);this.options=this.getOptions(b);this.enabled=true;if(this.options.trigger=="click"){this.$element.on("click."+this.type,this.options.selector,$.proxy(this.toggle,this))}else{if(this.options.trigger!="manual"){e=this.options.trigger=="hover"?"mouseenter":"focus";a=this.options.trigger=="hover"?"mouseleave":"blur";this.$element.on(e+"."+this.type,this.options.selector,$.proxy(this.enter,this));this.$element.on(a+"."+this.type,this.options.selector,$.proxy(this.leave,this))}}this.options.selector?(this._options=$.extend({},this.options,{trigger:"manual",selector:""})):this.fixTitle()},getOptions:function(a){a=$.extend({},$.fn[this.type].defaults,a,this.$element.data());if(a.delay&&typeof a.delay=="number"){a.delay={show:a.delay,hide:a.delay}}return a},enter:function(b){var a=$(b.currentTarget)[this.type](this._options).data(this.type);if(!a.options.delay||!a.options.delay.show){return a.show()}clearTimeout(this.timeout);a.hoverState="in";this.timeout=setTimeout(function(){if(a.hoverState=="in"){a.show()}},a.options.delay.show)},leave:function(b){var a=$(b.currentTarget)[this.type](this._options).data(this.type);if(this.timeout){clearTimeout(this.timeout)}if(!a.options.delay||!a.options.delay.hide){return a.hide()}a.hoverState="out";this.timeout=setTimeout(function(){if(a.hoverState=="out"){a.hide()}},a.options.delay.hide)},show:function(){var e,a,g,c,f,b,d;if(this.hasContent()&&this.enabled){e=this.tip();this.setContent();if(this.options.animation){e.addClass("fade")}b=typeof this.options.placement=="function"?this.options.placement.call(this,e[0],this.$element[0]):this.options.placement;a=/in/.test(b);e.remove().css({top:0,left:0,display:"block"}).appendTo(a?this.$element:document.body);g=this.getPosition(a);c=e[0].offsetWidth;f=e[0].offsetHeight;switch(a?b.split(" ")[1]:b){case"bottom":d={top:g.top+g.height,left:g.left+g.width/2-c/2};break;case"top":d={top:g.top-f,left:g.left+g.width/2-c/2};break;case"left":d={top:g.top+g.height/2-f/2,left:g.left-c};break;case"right":d={top:g.top+g.height/2-f/2,left:g.left+g.width};break}e.css(d).addClass(b).addClass("in")}},setContent:function(){var b=this.tip(),a=this.getTitle();b.find(".tooltip-inner")[this.options.html?"html":"text"](a);b.removeClass("fade in top bottom left right")},hide:function(){var a=this,b=this.tip();b.removeClass("in");function c(){var d=setTimeout(function(){b.off($.support.transition.end).remove()},500);b.one($.support.transition.end,function(){clearTimeout(d);b.remove()})}$.support.transition&&this.$tip.hasClass("fade")?c():b.remove();return this},fixTitle:function(){var a=this.$element;if(a.attr("title")||typeof(a.attr("data-original-title"))!="string"){a.attr("data-original-title",a.attr("title")||"").removeAttr("title")}},hasContent:function(){return this.getTitle()},getPosition:function(a){return $.extend({},(a?{top:0,left:0}:this.$element.offset()),{width:this.$element[0].offsetWidth,height:this.$element[0].offsetHeight})},getTitle:function(){var c,a=this.$element,b=this.options;c=a.attr("data-original-title")||(typeof b.title=="function"?b.title.call(a[0]):b.title);return c},tip:function(){return this.$tip=this.$tip||$(this.options.template)},validate:function(){if(!this.$element[0].parentNode){this.hide();this.$element=null;this.options=null}},enable:function(){this.enabled=true},disable:function(){this.enabled=false},toggleEnabled:function(){this.enabled=!this.enabled},toggle:function(){this[this.tip().hasClass("in")?"hide":"show"]()},destroy:function(){this.hide().$element.off("."+this.type).removeData(this.type)}};$.fn.tooltip=function(a){return this.each(function(){var d=$(this),c=d.data("tooltip"),b=typeof a=="object"&&a;if(!c){d.data("tooltip",(c=new Tooltip(this,b)))}if(typeof a=="string"){c[a]()}})};$.fn.tooltip.Constructor=Tooltip;$.fn.tooltip.defaults={animation:true,placement:"top",selector:false,template:'<div class="tooltip impactstory"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover",title:"",delay:0,html:true};





        jQuery.ajaxSetup({ cache:false });
        var ajax_load = '<img id="ti-loading" src="http://' + webappRoot + '/static/img/ajax-loader.gif" alt="loading..." />';

        if (!window.console) {
            console = {log: function() {}};
        }

        requestStylesheet("http://" + webappRoot + "/static/css/embed.css");
//        requestScript("http://" + webappRoot + "/static/js/icanhaz.js");
        requestScript("http://" + webappRoot + "/static/js/ti-item.js");

        jQuery(document).ready(function ($) {

            loadBadgesTemplate(webappRoot)
            $(".impactstory-embed").each(function(index){
                var thisDiv$ = $(this)

                // define the success callback here to use the context of the
                // *correct* impactstory-embed div; there may be several on teh
                // page.
                var insertBadges = function (dict, id) {
                    var itemView = new ItemView(jQuery)
                    var badgeSize = thisDiv$.attr("data-badge-size") == "small" ? "small" : ""
                    var badges$ = itemView.renderBadges(dict.awards, badgeSize)
                    badges$.find("span.label")
                        .wrap("<a href='http://" + webappRoot + "/item/"+ id[0] + "/" + id[1] +  "' target='_blank' />")
                    thisDiv$.empty()
                    badges$.appendTo(thisDiv$)

                }

                var itemNamespace = thisDiv$.attr("data-id-type")
                var itemId = thisDiv$.attr("data-id")
                var item = new Item([itemNamespace, itemId], new ItemView($), $)
                var apiKey = thisDiv$.attr("data-api-key")
                if (apiKey === undefined) return false // remember to set this
                item.get(
                    apiRoot,
                    apiKey,
                    function(dict, id) { // run insertBadges, then a user-defined callback
                        console.log("item.get() finished.")
                        insertBadges(dict, id)
                        getWindowCallback(thisDiv$, dict)
                    },
                    function(data){
                        thisDiv$.append("<span class='loading'>Gathering metrics now...</span>")
                    },
                    false
                )
            })




        });
    }
})()
