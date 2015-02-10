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
     * Make sure that the given src (which may be an xml doc or string) is returned
     * as an xml doc.  If it's a string, parse it into XML
     * 
     * @param {Object} src String or XMLDocument
     * @returns {Document} XML document of the given src
     */
    ensureXML: function(src) {
        if(typeof src === "string") {
            var parser = new DOMParser();
            src = parser.parseFromString(src, "text/xml");
        }
        
        return src;
    },
    
    /**
     * Get a JSON list of 
     * 
     * @param src {Object} XML string or XMLDocument object.  Will be parsed if String
     * 
     * @returns {Array} Array of JSON Objects for each rootfile in manifest
     * each with full-path and media-type attributes
     */
    getContainerRootfilesFromXML: function(src) {
        src = UstadJS.ensureXML(src);
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
    },
    
    /**
     * Remove the query portion of a URL (if present)
     * 
     * @param fullURL {String} URL possibly including a query string
     * 
     * @returns {String} the URL without the query string if it was there...
     */
    removeQueryFromURL: function(fullURL) {
        if(fullURL.indexOf("?") !== -1) {
            return fullURL.substring(0, fullURL.indexOf("?"));
        }else {
            return fullURL;
        }
    },
    
    /**
     * From the given url, which may be relative or absolute; construct an 
     * absoulte url.  Will use location object to determine current base URL
     * 
     * @method
     * 
     * @param {String} url Given url which may be absolute (e.g. starts with http:// or https://) or relative
     * 
     * @returns {String} URL made absoulute if it was not before
     */
    makeAbsoluteURL: function(url) {
        if(url.indexOf("://") !== -1) {
            return url;
        } else {
            var absURL = location.href.substring(0, 
                location.href.lastIndexOf("/")+1);
            absURL += url;
            return absURL;
        }
    },
};

var UstadJSOPDSFeed = null;

UstadJSOPDSFeed = function(title, id) {
    this.entries = [];
    this.xmlDoc = document.implementation.createDocument(
            "http://www.w3.org/2005/Atom", "feed");
        
    var idEl = this.xmlDoc.createElementNS("http://www.w3.org/2005/Atom", "id");
    idEl.textContent = id;
    this.xmlDoc.documentElement.appendChild(idEl);
    
    var titleEl = this.xmlDoc.createElementNS("http://www.w3.org/2005/Atom", 
        "title");
    titleEl.textContent = title;
    this.xmlDoc.documentElement.appendChild(titleEl);
    
    this.href = null;
};

/**
 * From the given source document make an object representing an OPDS feed
 * 
 * @param {Object} xmlSrc String or XML Document with the opds feed
 * @param {String} href URL of the opdsSrc
 * @returns {UstadJSOPDSFeed}
 */
UstadJSOPDSFeed.loadFromXML = function(xmlSrc, href) {
    xmlSrc = UstadJS.ensureXML(xmlSrc);
    var opdsFeedObj = new UstadJSOPDSFeed();
    opdsFeedObj.xmlDoc = xmlSrc;
    opdsFeedObj.href = href;
    
    //set properties up
    opdsFeedObj.setPropsFromXML(xmlSrc);
    
    return opdsFeedObj;
};


UstadJSOPDSFeed.prototype = {
    
    setPropsFromXML: function(xmlSrc) {
        xmlSrc = xmlSrc ? xmlSrc : this.xmlDoc;
        
        this.title = xmlSrc.querySelector("feed > title").textContent;
        this.id = xmlSrc.querySelector("feed > id").textContent;
        
        //now go through all entries
        var entryNodes = xmlSrc.getElementsByTagNameNS(
                "http://www.w3.org/2005/Atom", "entry");
        
        this.entries = [];
        
        for(var i = 0; i < entryNodes.length; i++) {
            var newEntry = new UstadJSOPDSEntry(entryNodes[i], this);
            this.entries.push(newEntry);
        }
    },
    
    /**
     * Add an opds entry to this feed
     * 
     * @param {UstadJSOPDSEntry} opdsEntry the entry to add
     */
    addEntry: function(opdsEntry) {
        this.entries.push(opdsEntry);
        var entryNodeCopy = this.xmlDoc.importNode(opdsEntry.xmlNode, true);
        this.xmlDoc.documentElement.appendChild(entryNodeCopy);
        entryNodeCopy.namespaceURI = "http://www.w3.org/2005/Atom";
    },
    
    /**
     * Get the entries in this feed according to the link type being looked
     * for e.g. get entries that are navigation catalogs by using:
     * 
     * getEntriesByLinkType("application/atom+xml;profile=opds-catalog;kind=acquisition")
     * 
     * 
     * @param {string} linkType type of link to look for (required)
     * @param {string} linkRel relationship of link to look for e.g. 
     * http://opds-spec.org/acquisition
     * @param {boolean=true} linkRelFallback if false match the exact type, otherwise settle for
     * substring match.  Eg. just http://opds-spec.org/acquisition will match
     * all other acquisition types
     * 
     * @returns {UstadJSOPDSEntry[]}
     */
    getEntriesByLinkParams: function(linkType, linkRel, linkRelFallback) {
        var matchingEntries = [];
        linkRelFallback = (typeof linkRelFallback === "undefined") ? true :
                linkRelFallback;
        for(var i = 0; i < this.entries.length; i++) {
            var acquireLink = this.entries[i].getAcquisitionLinks(linkRel,
                linkType, linkRelFallback);
            if(acquireLink) {
                matchingEntries.push(this.entries[i]);
            }
        }
        
        return matchingEntries;
    }
};


var UstadJSOPDSEntry = null;

UstadJSOPDSEntry = function(xmlNode, parentFeed) {
    this.xmlNode = null;
    this.parentFeed = null;
    this.title = null;
    this.id = null;
    
    if(parentFeed) {
        this.parentFeed = parentFeed;
    }
    
    if(xmlNode) {
        this.loadFromXMLNode(xmlNode);
    }
};

/**
 * OPDS constant for the standard acquisition link
 * @type String
 */
UstadJSOPDSEntry.LINK_ACQUIRE = "http://opds-spec.org/acquisition";
    
/**
 * OPDS constant for open access acquisition link
 * @type String
 */
UstadJSOPDSEntry.LINK_ACQUIRE_OPENACCESS = 
        "http://opds-spec.org/acquisition/open-access";

/**
 * Type to be used for a catalog link of an acquisition feed as per OPDS spec
 * 
 * @type String
 */
UstadJSOPDSEntry.TYPE_ACQUISITIONFEED = 
        "application/atom+xml;profile=opds-catalog;kind=acquisition";


/**
 * Type to be used for a navigation feed as per OPDS spec
 * 
 * @type String
 */
UstadJSOPDSEntry.TYPE_NAVIGATIONFEED =
        "application/atom+xml;profile=opds-catalog;kind=navigation";

/**
 * The type of link used for an epub file itself
 * 
 * @type String
 */
UstadJSOPDSEntry.TYPE_EPUBCONTAINER = "application/epub+zip";

UstadJSOPDSEntry.prototype = {
    
    
    /**
     * Get the aquisition links by 
     * @param {String} linkRel - the link relation desired - e.g. 
     *  http://opds-spec.org/acquisition/open-access or 
     *  http://opds-spec.org/acquisition/
     * @param {String} mimeType the desired content mimetype e.g. application/epub+zip
     * @param {boolean} fallback if the desired acquisition type is not available,
     *  should we return plain old http://opds-spec.org/acquisition
     * @returns {String} the href of the selected link, null if nothing found
     */
    getAcquisitionLinks: function(linkRel, mimeType, fallback) {
        //TODO: Should enforce namespace - this does not appear to work when 
        //using createDocument based stuff
        //var linkElements = this.xmlNode.getElementsByTagNameNS(
        //    "http://www.w3.org/2005/Atom", "link");
        var linkElements = this.xmlNode.getElementsByTagNameNS(
            "http://www.w3.org/2005/Atom", "link");
        var fallbackEl = null;
        for(var i = 0; i < linkElements.length; i++) {
            if(linkElements[i].getAttribute("type") === mimeType) {
                var linkElType = linkElements[i].getAttribute("rel");
                if(linkElType === linkRel) {
                    return linkElements[i].getAttribute("href");
                }
                
                if(linkElType === UstadJSOPDSEntry.LINK_ACQUIRE && fallback) {
                    fallbackEl = linkElements[i];
                }
            }
        }
        
        if(fallbackEl) {
            return fallbackEl.getAttribute("href");
        }else {
            return null;
        }
    },
    
    loadFromXMLNode: function(xmlNode) {
        this.xmlNode = xmlNode;
        this.title = xmlNode.querySelector("title").textContent;
        this.id = xmlNode.querySelector("id").textContent;
    }
    
};



/*
var UstadJSContainer = null;

UstadJSContainer = function() {
    this.publications = [];
    this.xmlDoc = null;
    this.uri = null;
    
};

*/


var UstadJSOPF = null;

//empty constructor
UstadJSOPF = function() {
    this.spine = [];
    this.items = {};
    this.xmlDoc = null;
    this.baseUrl = null;
    this.title = "";
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
        //and one identifier
        var manifestEl = this.xmlDoc.getElementsByTagName("metadata")[0];
        var titleEl = manifestEl.getElementsByTagNameNS("*", "title")[0];
        var idEl = manifestEl.getElementsByTagNameNS("*", "identifier")[0];
        this.title = titleEl.textContent;
        this.identifier = idEl.textContent;
    },
    
    /**
     * For this OPF generate a catalog entry node that can be included
     * in an OPDS feed
     * 
     * @param {Object} acquisitionOpts options for acquisitionLink containing:
     *   href : e.g. /somewhere/file.epub
     *   mime : e.g. application/epub+zip
     *   rel : e.g. http://opds-spec.org/acquisition/open-access (defaults to
     *    http://opds-spec.org/acquisition )
     *   
     * @param {UstadJSOPDSFeed} parentFeed - document object to use for purpose of creating
     *   DOM nodes 
     * 
     * @returns {undefined}
     */
    getOPDSEntry: function(acquisitionOpts, parentFeed) {
        var doc = parentFeed.xmlDoc;
        
        var entryNode = doc.createElementNS("http://www.w3.org/2005/Atom", 
            "entry");
        
        var titleNode = doc.createElementNS("http://www.w3.org/2005/Atom", 
            "title");
        titleNode.textContent = this.title;
        entryNode.appendChild(titleNode);
        
        var idNode = doc.createElementNS("http://www.w3.org/2005/Atom", "id");
        idNode.textContent = this.identifier;
        entryNode.appendChild(idNode);
        
        
        //find metadata - mandatory in an opf file
        var metaDataNode = this.xmlDoc.getElementsByTagName("*", "metadata")[0];
        for(var i = 0; i < metaDataNode.childNodes.length; i++) {
            var clonedNode = doc.importNode(metaDataNode.childNodes[i], true);
            entryNode.appendChild(clonedNode);
        }
        
        
        //TODO: add acquisition links
        var linkNode = doc.createElementNS("http://www.w3.org/2005/Atom", 
            "link");
        linkNode.setAttribute("href", acquisitionOpts.href);
        linkNode.setAttribute("type", acquisitionOpts.mime);
        linkNode.setAttribute("rel", acquisitionOpts.rel ?
            acquisitionOpts.rel : UstadJSOPDSEntry.LINK_ACQUIRE);
        entryNode.appendChild(linkNode);
        
        var opdsEntry = new UstadJSOPDSEntry(entryNode, parentFeed);
        return opdsEntry;
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

var UstadJSTinCanXML = null;

UstadJSTinCanXML = function() {
    //original XML source document
    this.xmlDoc = null;
    
    //the launch activity (TinCan.Activity)
    this.launchActivity = null;
    this.launchActivityID = null;
    
    //the launchable activity
    this._launchActivityEl = null;
};


/**
 * Figure out which element to use by language for an activity (e.g. launch, resource)
 * 
 * matches the user language, if not look for default language, otherwise use
 * first occuring launch element
 * 
 * @param tagName {String} Tag name -e.g. launch or resource
 * @param activityEl {Object} DOM node representing the activity element
 * @param userLang {String} The language the user wants (e.g. UI Language)
 * @param defaultLang {String} the system default fallback language (e.g. 
 * 
 * @returns {String} 
 */
UstadJSTinCanXML.getElementByLang = function(tagName, activityEl, userLang, defaultLang) {
    var launchEls = activityEl.getElementsByTagName(tagName);
    
    if(!defaultLang) {
        defaultLang = "en";
    }
    
    var langsToMatch = [userLang, defaultLang];
    var matchedNodes = [null, null];
    var matchedStrs = [null, null];
    
    for(var i = 0; i < launchEls.length; i++) {
        var thisLang = launchEls[i].getAttribute("lang");
        if(thisLang) {
            var thisLangLower = thisLang.toLowerCase();
            for(var j = 0; j < langsToMatch.length; j++) {
                if(thisLangLower === langsToMatch[j].toLowerCase()) {
                    //full match of user string
                    matchedNodes[j] = launchEls[i];
                    matchedStrs[j] = thisLang;
                }else if(!matchedNodes[j] && thisLangLower.substring(0, 2) === langsToMatch[j].substring(0, 2)) {
                    //match first part of user string e.g. en-US instead of en-GB
                    matchedNodes[j] = launchEls[i];
                    matchedStrs[j] = thisLang.substring(0, 2);
                }
            }
        }
    }
    
    for(var h = 0; h < matchedNodes.length; h++) {
        if(matchedNodes[h]) { 
            return matchedNodes[h];
        }
    }
    
    //no match of user language or default - return the first launch element
    return launchEls[0];
};



UstadJSTinCanXML.prototype = {
    
    /**
     * 
     * @param {Object} tcXMLSrc String or xml document
     * @returns {undefined}
     */
    loadFromXML: function(tcXMLSrc) {
        if(typeof tcXMLSrc === "string") {
            var parser = new DOMParser();
            tcXMLSrc  = parser.parseFromString(tcXMLSrc, "text/xml");
        }
        
        this.xmlDoc = tcXMLSrc;
        
        var activityElements = this.xmlDoc.getElementsByTagName("activity");
        for(var i = 0; i < activityElements.length; i++) {
            var launchEls = activityElements[i].getElementsByTagName("launch");
            
            if(launchEls.length > 0) {
                this.launchActivityID = activityElements[i].getAttribute("id");
                this._launchActivityEl = activityElements[i];
                break;
            }
        }
    },
    
    /**
     * Sets the launch activity info by language
     * 
     * @param {String} userLang user set language
     * @param {String} defaultLang default fallback language (optional)
     */
    makeLaunchedActivityDefByLang: function(userLang, defaultLang) {
        var launchNameEl = UstadJSTinCanXML.getElementByLang("name", 
            this._launchActivityEl, userLang, defaultLang);
        var descEl = UstadJSTinCanXML.getElementByLang("description",
            this._launchActivityEl, userLang, defaultLang);
        var launchLang = launchNameEl.getAttribute("lang");
        
        var myDefinition = {
            type : "http://adlnet.gov/expapi/activities/lesson",
            name : { },
            description : { }
    	};
        
        myDefinition.name[launchLang] = launchNameEl.textContent;
        myDefinition.description[launchLang] = descEl.textContent;
        
        return myDefinition;
    }
};


