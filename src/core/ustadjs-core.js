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
var UstadJS;

UstadJS = {
    
    /**
     * Get a JSON list of 
     * 
     * @param src {Object} XML string or XMLDocument object.  Will be parsed if String
     * 
     * @returns {Array} Array of JSON Objects for each rootfile in manifest
     * each with full-path and media-type attributes
     */
    getContainerRootfilesFromXML: function(src) {
        if(typeof src === "string") {
            var parser = new DOMParser();
            src = parser.parseFromString(src, "text/xml");
        }
        var retVal = [];
        var rootFileNodes = src.getElementsByTagName("rootfile");
        for(var i = 0; i < rootFileNodes.length; i++) {
            var currentChild = {
                "full-path" : rootFileNodes[i].getAttribute("full-path"),
                "media-type" : rootFileNodes[i].getAttribute("media-type")
            };
            retVal.push(currentChild);
        }
        
        return retVal;
    },
    
    /**
     * Handle running an optional calback with specified context and args
     * 
     * @param {function} fn function to run
     * @param {Object} context Context for this object
     * @param {Array} args to pass
     * @returns {undefined}
     */
    runCallback: function(fn, context, args) {
        if(typeof fn !== "undefined" && fn !== null) {
            fn.apply(context, args);
        }   
    }
};

var UstadJSOPF = null;

//empty constructor
UstadJSOPF = function() {
    
};

UstadJSOPF.prototype = {
    spine : [],
    items: {},
    xmlDoc : null,
    baseUrl: null,
    title: "",
    
    /**
     * 
     * @param {Object} String of OPF XML or XMLDocument already
     * 
     */
    loadFromOPF: function(opfSRC) {
        if(typeof opfSRC === "string") {
            var parser = new DOMParser();
            opfSRC  = parser.parseFromString(opfSRC, "text/xml");
        }
        
        this.xmlDoc = opfSRC;
        
        var manifest = this.xmlDoc.getElementsByTagName("manifest")[0];
        var itemNodes = manifest.getElementsByTagName("item");
        for(var i = 0; i < itemNodes.length; i++) {
            var opfItem = new UstadJSOPFItem(itemNodes[i].getAttribute("id"),
                itemNodes[i].getAttribute("media-type"),
                itemNodes[i].getAttribute("href"));
            if(itemNodes[i].hasAttribute("properties")) {
                opfItem.properties = 
                        itemNodes[i].getAttribute("properties");
            }
            this.items[opfItem.id] = opfItem;
        }
        
        //now find the spine
        var spine = this.xmlDoc.getElementsByTagName("spine")[0];
        var spineItems = spine.getElementsByTagName("itemref");
        for(var j = 0; j < spineItems.length; j++) {
            var itemID = spineItems[j].getAttribute("idref");
            this.spine.push(this.items[itemID]);
        }
        
        //now load meta data: according to OPF spec there must be at least one title
        var manifestEl = this.xmlDoc.getElementsByTagName("metadata")[0];
        var titleEl = manifestEl.getElementsByTagNameNS("*", "title")[0];
        this.title = titleEl.textContent;
    },
    
    /**
     * Lookup a given url to find it's position in the spine
     * 
     * @param {String} href
     * @returns {Number} index in spine
     */
    getSpinePositionByHref: function(href) {
        for(var i = 0; i < this.spine.length; i++) {
            if(this.spine[i].href === href) {
                return i;
            }
        }
        
        return -1;
    }
};

var UstadJSOPFItem = null;

UstadJSOPFItem = function(id, mediaType, href) {
    this.id = id;
    this.mediaType = mediaType;
    this.href = href;
};

UstadJSOPFItem.prototype = {
    id : null,
    mediaType : null,
    href : null,
    scripted: null
};
