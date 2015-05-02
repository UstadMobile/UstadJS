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

var $UstadJSOPDSBrowser = {};

$UstadJSOPDSBrowser.STATUS_UNKNOWN = "unknown";
$UstadJSOPDSBrowser.NOT_ACQUIRED = "notacquired";
$UstadJSOPDSBrowser.ACQUISITION_IN_PROGRESS = "inprogress";
$UstadJSOPDSBrowser.ACQUIRED = "acquired";

(function($){
    /**
     *
     * @class UstadJSOPDSBrowser
     * @memberOf jQuery.fn
     */
    $.widget("umjs.opdsbrowser", {
        options: {
            "src" : "",
            //custom feed loader (e.g. to check cached entries etc)
            feedloader: null,
            
            /**
             * @type {string}
             * icon to use when none specified by feed for an acquisition feed
             */
            defaulticon_acquisitionfeed: "default-acquire-icon.png",
            
            /**
             * @type {string}
             * icon to use when none is specified by feed for a navigation feed
             */
            defaulticon_navigationfeed: "default-navigation.png",
            
            /**
             * @type {string}
             * icon to show for entries in an acquisition feed with conatainers to download
             */
            defaulticon_containerelement: "default-containerel.png",
            
            /**
             * @type {UstadJSOPDSFeed}
             */
            _opdsFeedObj : null,
            
            /**
             * Callback to run when the user selects another feed
             * 
             * @type {function}
             */
            feedselected: null,
            
            /**
             * Callback to run when the user selects an acquisition container
             * (e.g. epub file)
             * 
             * @type {function}
             */
            containerselected : null,
            
            /**
             * A function that should return whether or not the given device id
             * has been acquired
             * 
             * @returns {boolean}
             */
            acquisitionstatushandler: function(id) {
                return $UstadJSOPDSBrowser.NOT_ACQUIRED;
            },
            
            button_text_navigation: {
                "unknown" : "Checking...",
                "notacquired" : "Open",
                "inprogress" : "Open",
                "acquired" : "Open"
            },
            
            button_text_acquisition: {
                "unknown" : "Checking...",
                "notacquired" : "Download",
                "inprogress" : "Downloading...",
                "acquired" : "Open"
            },
            
            /** If true and jQueryMobile is present, will call enhanceWithin */
            autoJQM : true
            
        },
        
        _create: function () {
            if(!this.element.hasClass("umjs_opdsbrowser")) {
                this.element.addClass("umjs_opdsbrowser");
            }
        },
        
        /**
         * Append appropriate CSS classed title to the main element here
         */
        _appendTitle: function(titleStr) {
            var titleEl = $("<div/>", {
                class : "umjs_opdsbrowser_title"
            });
            titleEl.text(titleStr);
            this.element.append(titleEl);
        },
        
        /**
         * Sets up a navigation feed view where acquisition feeds are shown
         * as tiles, other navigation feeds are shown as screen width category
         * buttons at the bottom.
         * 
         * Use with OPDS navigation feeds: e.g. link type
         * application/atom+xml;profile=opds-catalog;kind=navigation
         * see: http://opds-spec.org/specs/opds-catalog-1-1-20110627/#Navigation_Feeds
         * 
         * @param {UstadJSOPDSFeed} opdsSrc the source feed
         */
        setupnavigationfeedview: function(opdsSrc) {
            this.options._opdsFeedObj = opdsSrc;
            this._updateFeedAbsoluteBaseURL();
            
            this.element.empty();
            this.element.addClass("umjs_opdsbrowser_navfeed");
            
            this._appendTitle(opdsSrc.title);
            
            var feedItems = opdsSrc.getEntriesByLinkParams(null, 
                "application/atom+xml", {mimeTypeByPrefix: true});
            
            var feedElContainer= $("<ul/>", {
                "class" : "umjs_opdsbrowser_item_feed",
                "data-role" : "listview",
                "data-inset" : "true"
            });
            this.element.append(feedElContainer);
            
            var lastFeedItem = null;
            
            for(var g = 0; g < feedItems.length; g++) {
                var elEntry = this._makeFeedElement(feedItems[g], {
                    feedType : "navigation",
                    clickHandler: this._handleFeedClick.bind(this)
                });
                    
                feedElContainer.append(elEntry);
                lastFeedItem = feedElContainer;
            }
            
            //put the clearfix on so it will compute height
            lastFeedItem.addClass("umjs_clearfix");
            
            
            if(this.options.autoJQM && this.element.enhanceWithin) {
                this.element.enhanceWithin();
            }
            
        },
        
        setupacquisitionfeedview: function(opdsSrc) {
            this.options._opdsFeedObj = opdsSrc;
            this._updateFeedAbsoluteBaseURL();
            this.element.empty();
            this._appendTitle(opdsSrc.title);
            this.element.addClass("umjs_opdsbrowser_acqfeed");
            
            var elContainer = $("<ul/>", {
                "class" : "umjs_opdsbrowser_item_feed",
                "data-role" : "listview",
                "data-inset" : "true"
            }).appendTo(this.element);
            
            for(var f = 0; f < opdsSrc.entries.length; f++) {
                var containerEl = this._makeFeedElement(opdsSrc.entries[f], {
                    feedType: "acquisition",
                    clickHandler: this._handleContainerElClick.bind(this),
                    showSummary: true
                });
                elContainer.append(containerEl);
            }
            
            if(this.options.autoJQM && this.element.enhanceWithin) {
                this.element.enhanceWithin();
            }
        },
        
        /**
         * Setup this OPDS feed browser from the given feed object.  If 
         * an acquisition feed uses setupacquisitionfeedview otherwise
         * it's a navigation feed and use setupnavigationfeedview
         * 
         * @param {UstadJSOPDSFeed} opdsSrc Source OPDS element
         * @returns {undefined}
         */
        setupfromfeed: function(opdsSrc) {
            if(opdsSrc.isAcquisitionFeed()) {
                this.setupacquisitionfeedview(opdsSrc);
            }else {
                this.setupnavigationfeedview(opdsSrc);
            }
        },
        
        _updateFeedAbsoluteBaseURL: function() {
            this._feedAbsoluteBaseURL = UstadJS.makeAbsoluteURL(
                this.options._opdsFeedObj.href);
        },
        
        /**
         * 
         * @param {type} entryId
         * @param {type} elStatus
         * @param {type} options
         * @returns {undefined}
         */
        updateentrystatus: function(entryId, elStatus, options) {
            var entryEl = $("div.umjs_opdsbrowser_feedelement[data-feed-id='" +
                entryId + "']");
            var feedType = entryEl.attr("data-feed-type");
            
            /*entryEl.children(".umjs_opdsbrowser_statusarea").replaceWith(
                this._makeFeedElementStatusArea(entryId, feedType, elStatus, 
                options));*/
        },
        
        updateentryprogress: function(entryId, progressEvt) {
            var progressEl = $("div.umjs_opdsbrowser_feedelement[data-feed-id='" +
                entryId + "'] progress");
            progressEl.attr("value", progressEvt.loaded);
            progressEl.attr("max", progressEvt.total);
        },
        
        _handleContainerElClick: function(evt, data) {
            var clickedLink = $(evt.delegateTarget);
            var clickedEntry = clickedLink.parent("li");
            var entryId = clickedEntry.attr("data-entry-id");
            var entry = this.options._opdsFeedObj.getEntryById(entryId);
            
            this._trigger("containerselected", null, {
                entryId : entryId,
                entry : entry
            });
        },
        
        /**
         * Fire the feedselected event when the user clicks on a feed 
         * displayed
         * 
         * @param {Event} evt
         * @param {Object} data
         */
        _handleFeedClick: function(evt, data) {
            var clickedFeedEntryLink = $(evt.delegateTarget);
            var clickedFeedEntry = clickedFeedEntryLink.parent("li");
            var clickedFeedId = $(clickedFeedEntry).attr("data-entry-id");
            var clickedFeedType = $(clickedFeedEntry).attr("data-entry-type");
            this._trigger("feedselected", null, {
                feedId : clickedFeedId,
                feedType : clickedFeedType,
                entry : this.options._opdsFeedObj.getEntryById(clickedFeedId)
            });
        },
        
        
        
        /**
         * Make the status area for a feed element being shown
         * 
         * @param {string} entryId The entry we are making a 
         * @param {string} feedType "navigation" or "acquisition"
         * @param {string} elStatus String as per $UstadJSOPDSBrowser constants
         * @param {Object} options if status is in progress have .progress as num between 0 and 100
         * @returns {jQuery|$} element for the feed status area
         */
        _makeFeedElementStatusArea: function(entryId, feedType, elStatus, options) {
            var statusClassName = "umjs_opdsbrowser_elstatus_" + elStatus;
            
            var elStatusArea = $("<div/>", {
                "class": "umjs_opdsbrowser_" + feedType + "statusarea" +
                    " " + statusClassName
            });
            
            elStatusArea.addClass("umjs_opdsbrowser_statusarea");
            
            if(elStatus === $UstadJSOPDSBrowser.ACQUISITION_IN_PROGRESS) {
                var progressBar = $("<progress/>",{
                    "value" : options.loaded,
                    "max" : options.total
                });
                
                elStatusArea.append(progressBar);
            }else {
                var buttonText = this.options["button_text_" + feedType][elStatus];
                var buttonEl = $("<button/>");
                buttonEl.text(buttonText);
                elStatusArea.append(buttonEl);
            }
            
            return elStatusArea;
        },
        
        /**
         * Generate the credit text for an opds entry - first look for publisher
         * if none, then use author
         * 
         * @param {type} entry
         * @returns {undefined}
         */
        _makeCreditForEntry: function(entry) {
            return entry.getPublisher();
        },
        
        /**
         * Make a div element that will represent an feed object to be clicked on
         * 
         * @param {UstadJSOPDSEntry} entry the entry to make an element for
         * @param {Object} options
         * @param {function} options.clickHandler event handling method
         * @param {String} [options.feedType=navigation] feed type
         * @param {boolean} [options.showSummary=false] If true add the content
         * of the OPDS entry
         * 
         * @returns {$|jQuery}
         */
        _makeFeedElement: function(entry, options) {
            var feedType = options.feedType || "navigation";
            var elEntry = $("<li/>", {
                class : "umjs_opdsbrowser_" + feedType + "feed_element",
                "data-entry-id" : entry.id,
                "data-entry-type" : feedType
            });
            
            elEntry.addClass("umjs_opdsbrowser_feedelement");
            
            var elLink = $("<a/>", {
                "href" : "#"
            });
            elEntry.append(elLink);
            
            if(options.clickHandler) {
                elLink.on("click", options.clickHandler);
            }
            
            
            var entryThumbnail = entry.getThumbnail();
            var imgSrc = entryThumbnail ? 
                UstadJS.resolveURL(this._feedAbsoluteBaseURL, entryThumbnail) : 
                this.options["defaulticon_" + feedType + "feed"];
            
            elLink.append($("<img/>", {
                "src": imgSrc,
                "class": "umjs_opdsbrowser_" + feedType + "feed_img ui-li-thumb"
            }));
            
            var elTitleEntry = $("<h2/>", {
                "class" : "umjs_opdsbrowser_" + feedType + "title"
            });
            elTitleEntry.text(entry.title);
            
            elLink.append(elTitleEntry);
            
            var elStatus = this.options.acquisitionstatushandler(entry.id, 
                feedType);
            //Disable this for now
            /*
            elEntry.append(this._makeFeedElementStatusArea(entry.id, feedType,
                elStatus));
            */
            
            var pContent = $("<p/>");
            if(options.showSummary) {
                var entrySummary = entry.getSummary() || "";
                pContent.append(entrySummary);
            }
            
            var providerImgLinks = entry.getLinks(
                "http://www.ustadmobile.com/providerimg", null);
        
            if(providerImgLinks.length > 0) {
                var providerImgSrc= UstadJS.resolveURL(
                    this._feedAbsoluteBaseURL, providerImgLinks[0].href);
                $("<img/>", {
                    "class" : "provider-logo",
                    "src" : providerImgSrc
                }).appendTo(pContent);
            }
            
            
            if(entry.getPublisher()) {
                pContent.append(this._makeCreditForEntry(entry));
            }
            elLink.append(pContent);
            
            return elEntry;
        }
        
    });
}(jQuery));    
