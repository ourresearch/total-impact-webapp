// {% raw %} this tag is needed or else the Jinja2 templating engine being used
// to serve this page will freak out over the similar-looking mustache strings
// used as part of the ICanHaz mustache implementation....
/*!
 ICanHaz.js version 0.10.1 -- by @HenrikJoreteg
 More info at: http://icanhazjs.com
 */
(function(){var a=function(){var b=Object.prototype.toString;Array.isArray=Array.isArray||function(k){return b.call(k)=="[object Array]"};var j=String.prototype.trim,c;if(j){c=function(k){return k==null?"":j.call(k)}}else{var d,h;if((/\S/).test("\xA0")){d=/^[\s\xA0]+/;h=/[\s\xA0]+$/}else{d=/^\s+/;h=/\s+$/}c=function(k){return k==null?"":k.toString().replace(d,"").replace(h,"")}}var g={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function i(k){return String(k).replace(/&(?!\w+;)|[<>"']/g,function(l){return g[l]||l})}var f={};var e=function(){};e.prototype={otag:"{{",ctag:"}}",pragmas:{},buffer:[],pragmas_implemented:{"IMPLICIT-ITERATOR":true},context:{},render:function(n,m,l,o){if(!o){this.context=m;this.buffer=[]}if(!this.includes("",n)){if(o){return n}else{this.send(n);return}}n=this.render_pragmas(n);var k=this.render_section(n,m,l);if(k===false){k=this.render_tags(n,m,l,o)}if(o){return k}else{this.sendLines(k)}},send:function(k){if(k!==""){this.buffer.push(k)}},sendLines:function(m){if(m){var k=m.split("\n");for(var l=0;l<k.length;l++){this.send(k[l])}}},render_pragmas:function(k){if(!this.includes("%",k)){return k}var m=this;var l=this.getCachedRegex("render_pragmas",function(o,n){return new RegExp(o+"%([\\w-]+) ?([\\w]+=[\\w]+)?"+n,"g")});return k.replace(l,function(p,n,o){if(!m.pragmas_implemented[n]){throw ({message:"This implementation of mustache doesn't understand the '"+n+"' pragma"})}m.pragmas[n]={};if(o){var q=o.split("=");m.pragmas[n][q[0]]=q[1]}return""})},render_partial:function(k,m,l){k=c(k);if(!l||l[k]===undefined){throw ({message:"unknown_partial '"+k+"'"})}if(!m||typeof m[k]!="object"){return this.render(l[k],m,l,true)}return this.render(l[k],m[k],l,true)},render_section:function(m,l,k){if(!this.includes("#",m)&&!this.includes("^",m)){return false}var o=this;var n=this.getCachedRegex("render_section",function(q,p){return new RegExp("^([\\s\\S]*?)"+q+"(\\^|\\#)\\s*(.+)\\s*"+p+"\n*([\\s\\S]*?)"+q+"\\/\\s*\\3\\s*"+p+"\\s*([\\s\\S]*)$","g")});return m.replace(n,function(s,w,v,r,t,q){var y=w?o.render_tags(w,l,k,true):"",u=q?o.render(q,l,k,true):"",p,x=o.find(r,l);if(v==="^"){if(!x||Array.isArray(x)&&x.length===0){p=o.render(t,l,k,true)}else{p=""}}else{if(v==="#"){if(Array.isArray(x)){p=o.map(x,function(z){return o.render(t,o.create_context(z),k,true)}).join("")}else{if(o.is_object(x)){p=o.render(t,o.create_context(x),k,true)}else{if(typeof x=="function"){p=x.call(l,t,function(z){return o.render(z,l,k,true)})}else{if(x){p=o.render(t,l,k,true)}else{p=""}}}}}}return y+p+u})},render_tags:function(s,k,m,o){var n=this;var r=function(){return n.getCachedRegex("render_tags",function(v,u){return new RegExp(v+"(=|!|>|&|\\{|%)?([^#\\^]+?)\\1?"+u+"+","g")})};var p=r();var q=function(w,u,v){switch(u){case"!":return"";case"=":n.set_delimiters(v);p=r();return"";case">":return n.render_partial(v,k,m);case"{":case"&":return n.find(v,k);default:return i(n.find(v,k))}};var t=s.split("\n");for(var l=0;l<t.length;l++){t[l]=t[l].replace(p,q,this);if(!o){this.send(t[l])}}if(o){return t.join("\n")}},set_delimiters:function(l){var k=l.split(" ");this.otag=this.escape_regex(k[0]);this.ctag=this.escape_regex(k[1])},escape_regex:function(l){if(!arguments.callee.sRE){var k=["/",".","*","+","?","|","(",")","[","]","{","}","\\"];arguments.callee.sRE=new RegExp("(\\"+k.join("|\\")+")","g")}return l.replace(arguments.callee.sRE,"\\$1")},find:function(m,n){m=c(m);function l(p){return p===false||p===0||p}var o;if(m.match(/([a-z_]+)\./ig)){var k=this.walk_context(m,n);if(l(k)){o=k}}else{if(l(n[m])){o=n[m]}else{if(l(this.context[m])){o=this.context[m]}}}if(typeof o=="function"){return o.apply(n)}if(o!==undefined){return o}return""},walk_context:function(k,l){var o=k.split(".");var n=(l[o[0]]!=undefined)?l:this.context;var m=n[o.shift()];while(m!=undefined&&o.length>0){n=m;m=m[o.shift()]}if(typeof m=="function"){return m.apply(n)}return m},includes:function(l,k){return k.indexOf(this.otag+l)!=-1},create_context:function(l){if(this.is_object(l)){return l}else{var m=".";if(this.pragmas["IMPLICIT-ITERATOR"]){m=this.pragmas["IMPLICIT-ITERATOR"].iterator}var k={};k[m]=l;return k}},is_object:function(k){return k&&typeof k=="object"},map:function(p,n){if(typeof p.map=="function"){return p.map(n)}else{var o=[];var k=p.length;for(var m=0;m<k;m++){o.push(n(p[m]))}return o}},getCachedRegex:function(l,o){var n=f[this.otag];if(!n){n=f[this.otag]={}}var k=n[this.ctag];if(!k){k=n[this.ctag]={}}var m=k[l];if(!m){m=k[l]=o(this.otag,this.ctag)}return m}};return({name:"mustache.js",version:"0.4.0",to_html:function(m,k,l,o){var n=new e();if(o){n.send=o}n.render(m,k||{},l);if(!o){return n.buffer.join("\n")}}})}();
    /*!
     ICanHaz.js -- by @HenrikJoreteg
     */
    (function(){function b(e){if("".trim){return e.trim()}else{return e.replace(/^\s+/,"").replace(/\s+$/,"")}}var c={VERSION:"0.10.1",templates:{},$:(typeof window!=="undefined")?window.jQuery||window.Zepto||null:null,addTemplate:function(e,g){if(typeof e==="object"){for(var f in e){this.addTemplate(f,e[f])}return}if(c[e]){console.error("Invalid name: "+e+".")}else{if(c.templates[e]){console.error('Template "'+e+'  " exists')}else{c.templates[e]=g;c[e]=function(j,i){j=j||{};var h=a.to_html(c.templates[e],j,c.templates);return(c.$&&!i)?c.$(h):h}}}},clearAll:function(){for(var e in c.templates){delete c[e]}c.templates={}},refresh:function(){c.clearAll();c.grabTemplates()},grabTemplates:function(){var j,f,e=document.getElementsByTagName("script"),g,h=[];for(j=0,f=e.length;j<f;j++){g=e[j];if(g&&g.innerHTML&&g.id&&(g.type==="text/html"||g.type==="text/x-icanhaz")){c.addTemplate(g.id,b(g.innerHTML));h.unshift(g)}}for(j=0,f=h.length;j<f;j++){h[j].parentNode.removeChild(h[j])}}};if(typeof require!=="undefined"){module.exports=c}else{window.ich=c}if(typeof document!=="undefined"){if(c.$){c.$(function(){c.grabTemplates()})}else{var d=function(){c.grabTemplates()};if(document.addEventListener){document.addEventListener("DOMContentLoaded",d,true)}else{if(document.attachEvent){document.attachEvent("DOMContentLoaded",d)}}}}})()})();
// {% endraw %}







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
            window.console = {log: function() {}};
        }

        requestStylesheet("http://" + webappRoot + "/static/css/embed.css");
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
