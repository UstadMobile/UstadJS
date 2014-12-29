/*

UstadJS

Copyright 2014 UstadMobile, Inc
  www.ustadmobile.com

Ustad Mobile is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version with the following additional terms:
 
All names, links, and logos of Ustad Mobile and Toughra Technologies FZ
LLC must be kept as they are in the original distribution.  If any new
screens are added you must include the Ustad Mobile logo as it has been
used in the original distribution.  You may not create any new
functionality whose purpose is to diminish or remove the Ustad Mobile
Logo.  You must leave the Ustad Mobile logo as the logo for the
application to be used with any launcher (e.g. the mobile app launcher).
 
If you want a commercial license to remove the above restriction you must
contact us and purchase a license without these restrictions.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 
Ustad Mobile is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

 */

(function($){
    /**
     * attemptidevice - an awesome jQuery plugin. 
     *
     * @class umjsEpubframe
     * @memberOf jQuery.fn
     */
    $.widget("umjs.opubframe", {
        options : {
            "editable" : false,
            "spine_pos" : 0,
            "baseurl" : null,
            //the UstadJSOPF object being represented
            "opf" : null,
            "height" : "100%",
            "num_pages" : 0,
            //the query parameters to add (e.g. tincan params) 
            "page_query_params": null
        },
        
        /**
         * Main widget creation
         */
        _create : function() {
            this.iframeElement = document.createElement("iframe");
            this.element.append(this.iframeElement);
            $(this.iframeElement).css("width", "100%").css("height", "100%");
            $(this.iframeElement).css("margin", "0px");
            $(this.iframeElement).css("border", "none");
            
            this.iframeElement.addEventListener("load",
                $.proxy(this.iframeLoadEvt, this), true);
            this.runOnceOnFrameLoad = [];
            $(this.element).addClass("umjs-opubframe");
        },
        
        _setOption: function(key, value) {
            this._super(key, value);
            if(key === "height") {
                $(this.element).css("height", value);
                $(this.iframeElement).css("height", 
                    $(this.element).outerHeight(false)-4);
            }
        },
        
        /**
         * Add the appropriate query parameters to the given url
         * 
         * @param {String} url URL to add parameters to
         * @returns {String} the url with query parameters (if any)
         */
        appendParamsToURL: function(url) {
            if(this.options.page_query_params) {
                return url + "?" + this.options.page_query_params;
            }else {
                return url;
            }
        },
        
        iframeLoadEvt: function(evt) {
            //figure out where we are relative to package.opf
            var iframeSrc = evt.target.src;
            var relativeURL = iframeSrc.substring(iframeSrc.indexOf(
                    this.options.baseurl) + this.options.baseurl.length);
            relativeURL = UstadJS.removeQueryFromURL(relativeURL);
            this.options.spine_pos = this.options.opf.getSpinePositionByHref(
                    relativeURL);
            $(this.element).trigger("pageloaded", evt, {"relativeURL" :
                        relativeURL});
        },
        
        /**
         * Load publication by path specified to the OPF file
         * 
         * @param {String} opfURL URL of OPF file
         * @param {function} callback
         */
        loadfromopf: function(opfURL, callback) {
            var opfBaseURL = location.href.substring(0, 
                location.href.lastIndexOf("/")+1);
            opfBaseURL += opfURL.substring(0, opfURL.lastIndexOf("/")+1);
            
            this.options.baseurl = opfBaseURL;
            $.ajax(opfURL, {
                dataType : "text"
            }).done($.proxy(function(data) {
                this.options.opf = new UstadJSOPF();
                this.options.opf.loadFromOPF(data);
                var firstURL = opfBaseURL + this.options.opf.spine[0].href;
                firstURL = this.appendParamsToURL(firstURL);
                
                this.options.num_pages = this.options.opf.spine.length;
                
                this.iframeElement.setAttribute("src",firstURL);
                $(this.iframeElement).one("load", null, $.proxy(function() {
                    UstadJS.runCallback(callback, this, ["success", 
                    this.options.opf]);
                }, this));
            }, this));
        },
        
        /**
         * Load publication from container manifest
         * 
         * First open the META-INF/container.xml to find root files
         * 
         * Then load the OPF of the root file at position given by 
         * containerRootIndex
         * 
         * Then display the cover page
         * 
         * @param {type} baseURL base URL to directory with extracted container
         * @param {type} containerRootIndex root package file to load (e.g. 0 for first publication)
         * @param {function} callback function to call when done - args are status, opf
         */
        loadfrommanifest: function(baseURL, containerRootIndex, callback) {
            if(baseURL.charAt(baseURL.length-1) !== '/') {
                baseURL += '/';
            }
            
            var containerURL = baseURL + "META-INF/container.xml";
            $.ajax(containerURL, {
                dataType : "text"
            }).done($.proxy(function(data) {
                var rootFilesArr = UstadJS.getContainerRootfilesFromXML(data);
                var opfURL = baseURL + rootFilesArr[containerRootIndex]['full-path'];
                console.log("opfURL is : " + opfURL);
                this.loadfromopf(opfURL, callback);
            }, this));
        },
        
        /**
         * Navigate along the spine (e.g. back/next)
         * 
         * @param {type} increment
         * @returns {undefined}
         */
        go: function(increment, callback) {
            var nextIndex = this.options.spine_pos + increment;
            var nextURL = this.options.baseurl + 
                    this.options.opf.spine[nextIndex].href;
            nextURL = this.appendParamsToURL(nextURL);
            this.iframeElement.setAttribute("src", nextURL);
            $(this.iframeElement).one("load", null, $.proxy(function() {
                        UstadJS.runCallback(callback, this, ["success"]);
                    }, this));
        }
    });
}(jQuery));
