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
             * @type {UstadJSOPDSFeed}
             */
            _opdsFeedObj : null,
            
            /**
             * Callback to run when the user selects a navigation feed
             * 
             * @type {function}
             */
            navigationfeedselected: null,
            
            /**
             * Callback to run when the user selects an acquisition feed
             * 
             * @type {function}
             */
            acquisitionfeedselected: null
            
        },
        
        _create: function () {
            if(!this.element.hasClass("umjs_opdsbrowser")) {
                this.element.addClass("umjs_opdsbrowser");
            }
        },
        
        /**
         * Setup this OPDS feed browser from the given feed object.  This can be
         * called on the same widget with a different feed, e.g. when the user
         * clicks on a subcategory etc.
         * 
         * @param {UstadJSOPDSFeed} opdsSrc Source OPDS element
         * @returns {undefined}
         */
        setupfromfeed: function(opdsSrc) {
            this.element.empty();
            this.options._opdsFeedObj = opdsSrc;
            
            var titleEl = $("<div/>", {
                class : "umjs_opdsbrowser_title"
            });
            titleEl.text(opdsSrc.title);
            this.element.append(titleEl);
            
            
            this.element.append(this.acquisitionFeedContainer);
            
            var feedInfo = [
                {
                    "type" : "acquisition",
                    "linkType" : UstadJSOPDSEntry.TYPE_ACQUISITIONFEED,
                },
                {
                    "type" : "navigation",
                    "linkType" : UstadJSOPDSEntry.TYPE_NAVIGATIONFEED
                }
            ];
            
            for(var f = 0; f < feedInfo.length; f++) {
                var feedType = feedInfo[f].type;
                var feedElContainer= $("<div/>", {
                    class : "umjs_opdsbrowser_" + feedType + "feeds"
                });
                
                this[feedType + "FeedContainer"]  = feedElContainer;
                this.element.append(feedElContainer);
                
                var feedList = opdsSrc.getEntriesByLinkParams(
                    feedInfo[f].linkType,
                    UstadJSOPDSEntry.LINK_ACQUIRE);
                for(var e = 0; e < feedList.length; e++) {
                    var elEntry = this._makeFeedElement(feedList[e],
                        feedType);
                    feedElContainer.append(elEntry);
                }
            }
        },
        
        /**
         * Make a div element that will represent an feed object to be clicked on
         * 
         * @param {UstadJSOPDSEntry} entry the entry to make an element for
         * @param {string} feedType acquisition or navigation
         * 
         * @returns {$|jQuery}
         */
        _makeFeedElement: function(entry, feedType) {
            var elEntry = $("<div/>", {
                class : "umjs_opdsbrowser_" + feedType + "feed_element",
                "data-feed-id" : entry.id,
                "data-feed-type" : feedType
            });
            
            elEntry.on("click", $.proxy(function(evt) {
                console.log("Click on " + evt.srcElement);
            }, this));
            
            //TODO: check the picture here
            var imgSrc = this.options["defaulticon_" + feedType + "feed"];
            
            elEntry.append($("<img/>", {
                "src": imgSrc,
                "class": "umjs_opdsbrowser_" + feedType + "feed_img"
            }));
            
            var elTitleEntry = $("<div/>", {
                "class" : "umjs_opdsbrowser_" + feedType + "title"
            });
            elTitleEntry.text(entry.title);
            elEntry.append(elTitleEntry);
            
            return elEntry;
        },
        
    });
}(jQuery));    
