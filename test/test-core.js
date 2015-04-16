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
QUnit.module("UstadJS-Core");

(function() {
    testUstadJSGetContainer();
    
    testPathResolver();
    
    testRunCallback();
    
    testURLQueryRemoval();
    testAbsoluteURLs();
    
    testTinCanXML();
    testOPDSFeed();
    testUstadJSLoadOPF();
    
}());

function testPathResolver() {
    QUnit.test("test path resolver outcomes", function(assert) {
        assert.expect(7);
        assert.equal(UstadJS.resolveURL("http://www.bbc.co.uk/", "some/file/d.jpg"),
            "http://www.bbc.co.uk/some/file/d.jpg", "OK when ending with /");
        assert.equal(UstadJS.resolveURL("https://www.yahoo.com/somedir", 
            "file/path.jpg"), "https://www.yahoo.com/file/path.jpg", 
            "OK when absolute URL does not have trailing slash");
        assert.equal(UstadJS.resolveURL("https://www.sun.com/some/dir/path",
            "/base.css"), "https://www.sun.com/base.css",
            "OK when using / to indicate path relative to server");
        assert.equal(UstadJS.resolveURL("http://www.somewhere.com/some/fly",
            "http://absolutelink.com/some/file.opds"), 
            "http://absolutelink.com/some/file.opds",
            "Leaves absolute links as is");
        assert.equal(UstadJS.resolveURL("https://someserver.com/page",
            "//some.cdn.com/some/file.css"), 
            "https://some.cdn.com/some/file.css");
        assert.equal(UstadJS.resolveURL("https:/www.someplace.com/some/place.html",
            "../file.jpg"), 
            "https:/www.someplace.com/file.jpg");
        assert.equal(UstadJS.resolveURL("https:/www.someplace.com/some/place.html",
            "./file.jpg"), 
            "https:/www.someplace.com/some/file.jpg");
    });
}


function testOPDSFeed() {
    QUnit.test("Load and interpret opds feed", function(assert) {
        assert.expect(22);
        var opdsDoneFn = assert.async();
        
        $.ajax("assets/catalog1.opds", {
            dataType  : "text"
        }).done(function(opdsStr){
            var opdsObj = UstadJSOPDSFeed.loadFromXML(opdsStr, 
                "assets/catalog1.opds");
            assert.ok(opdsObj.title, "Found course title");
            assert.ok(opdsObj.entries.length > 0, "OPDS catalog has entries");
            assert.ok(opdsObj.isAcquisitionFeed() === true, 
                "catalog1.opds is an acquisition feed");
            
            
            var entry0Summary = opdsObj.entries[0].getSummary();
            
            assert.equal(opdsObj.getEntryById(opdsObj.entries[0].id),
                opdsObj.entries[0], "Can find entry by ID");
            assert.equal(opdsObj.getEntryById("THISAINT/HERE/BUDDY"),
                null, "Asking for entry not in feed returns null");
            
            assert.equal(entry0Summary.substring(0, 31),
                "The story of the son of the Bob",
                "Got summary from first atom:summary item");
            
            //make sure this has loaded the thumbnail
            assert.equal(opdsObj.entries[0].getThumbnail(),
                "/covers/4561.thmb.gif",
                "Loaded correct thumbnail for entry 0");
            
            //make sure the fallback to the image works
            assert.equal(opdsObj.entries[1].getThumbnail(),
                "/covers/11241.lrg.jpg",
                "Loaded image as thumbnail when no thumbnail itself is present");
            
            
            var entry1Summary = opdsObj.entries[1].getSummary();
            assert.equal(entry1Summary.substring(0, 28), 
                "The definitive reference for",
                "Got summary from the atom:content item when summary not present");
                
            
            
            var asString = opdsObj.toString();
            var opdsObj2 = UstadJSOPDSFeed.loadFromXML(asString, 
                "assets/catalog1.opds");
            assert.ok(opdsObj2.title === opdsObj.title, 
                "Title same on load from string");
            assert.ok(opdsObj2.id === opdsObj.id,
                "ID same on loaded from string");
            assert.ok(opdsObj2.entries.length === opdsObj2.entries.length,
                "Same number of entries");
            
            var missingLink = false;
            for(var i = 0; i < opdsObj.entries.length; i++) {
                var acquireLink = opdsObj.entries[i].getAcquisitionLinks(
                        UstadJSOPDSEntry.LINK_ACQUIRE, "application/epub+zip",
                        true);
                missingLink = missingLink || !acquireLink;
            }
            assert.ok(!missingLink, "Found acquire link for all entries");
            
            //asking getLinks for a link type that does not exist will return
            //an empty array
            assert.equal(opdsObj.entries[0].getAcquisitionLinks("relNOTHERE", 
                "type/not+here"), null, 
                "Asking for a rel/link type not present returns null");
            
            //test programmatically adding an entry manually with strings
            
            var newItemProps = { 
                title : "This woz added",
                id : "com.ustadmobile.newitem_added"
            }; 

            var newEntry = new UstadJSOPDSEntry(null, opdsObj);
            newEntry.setupEntry(newItemProps);
            var foundIds = opdsObj.xmlDoc.querySelectorAll("feed > entry > id");
            var matchEntry = "";
            for(var i = 0; i < foundIds.length; i++) {
                if(foundIds[i].textContent === newItemProps.id) {
                    matchEntry = foundIds[i].textContent;
                }
            }
            
            newEntry.addLink(UstadJSOPDSEntry.LINK_ACQUIRE,
                "some/file.epub", UstadJSOPDSEntry.TYPE_EPUBCONTAINER);
            
            assert.equal(newEntry.getAcquisitionLinks(UstadJSOPDSEntry.LINK_ACQUIRE,
                UstadJSOPDSEntry.TYPE_EPUBCONTAINER, true), "some/file.epub",
                "Added link href can be found");
            
            assert.equal(newEntry.getThumbnail(), null, 
                "Item with no thumbnail returns null");
            
            assert.equal(matchEntry, newItemProps.id, 
                "Added entry to catalog 'manually' with strings");
            
            assert.equal(newEntry.getSummary(""), "", 
                "Use fallback summary when no content or summary item present");
            
            //test adding an entry
            $.ajax("assets/package.opf", {
                dataType : "text"
            }).done(function (opfStr) {
                var ustadOPFObj = new UstadJSOPF();
                ustadOPFObj.loadFromOPF(opfStr);
                var newEntry = ustadOPFObj.getOPDSEntry({
                    mime: "application/epub+zip",
                    href: "assets/somewhere.epub"
                }, opdsObj);
                var numEntries = opdsObj.entries.length;
                opdsObj.addEntry(newEntry);
                assert.equal(numEntries+1, opdsObj.entries.length,
                    "New OPDS entry added to feed");
                
                var matchingLinkSearchResult = opdsObj.getEntriesByLinkParams(
                        UstadJSOPDSEntry.LINK_ACQUIRE, "application/epub+zip",
                    {linkRelByPrefix: true});
                var numMatchingEntries = matchingLinkSearchResult.length;
                assert.ok(numMatchingEntries >= 1,  
                    "Found " + numMatchingEntries + " entries");
                    
                //test that we can find the next linear items
                var firstLinearItemIndex = ustadOPFObj.findNextLinearSpineIndex(
                    0, 1);
                assert.equal(firstLinearItemIndex, 1, 
                    "First Linear item is index 1 - skip linear=no on cover");
                //test that we will get -1 if it's not findable
                var cantFindLinearIndex = ustadOPFObj.findNextLinearSpineIndex(0, 
                    -1);
                assert.equal(cantFindLinearIndex, -1, 
                    "When no more linear items are available returns -1");
                
                
                opdsDoneFn();
            });
            
            
        });
    });
    
}

function testTinCanXML() {
    QUnit.test("Load and interpret TinCanXML", function(assert) {
        assert.expect(9);
        var tcDonefn = assert.async();
        
        $.ajax("assets/tincan.xml", {
            dataType  : "text"
        }).done(function(tcxmlStr){
            var ujsTinCanObj = new UstadJSTinCanXML();
            ujsTinCanObj.loadFromXML(tcxmlStr);
            assert.equal(ujsTinCanObj.launchActivityID,
                "http://www.ustadmobile.com/um-tincan/activities/8cd214e4-7861-4f3a-b227-493b45a4609c",
                "Got correct ID from TinCan XML");
            
            //try making the launched activity definition
            var launchDef = ujsTinCanObj.makeLaunchedActivityDefByLang("en");
            assert.equal(launchDef.name.en, "Important Guide Name");
            assert.equal(launchDef.description.en, "Important Guide");
        
            $.ajax("assets/tincan-multilang.xml", {
                dataType : "text"
            }).done(function(tcMlStr){
                var ujsTinCanML = new UstadJSTinCanXML();
                ujsTinCanML.loadFromXML(tcMlStr);
                var activityElements = ujsTinCanML.xmlDoc.getElementsByTagName(
                        "activity");
                var launchableActivity = null;
                for(var i = 0; i < activityElements.length; i++) {
                    if(activityElements[i].getElementsByTagName("launch").length > 0) {
                        launchableActivity = activityElements[i];
                        break;
                    }
                }

                //user language = fr, expect english result back (default)
                var wantFREl = UstadJSTinCanXML.getElementByLang("launch", 
                    launchableActivity, "fr");
                assert.equal(wantFREl.getAttribute("lang"), "en", 
                    "Fallback to english as default fallback lang");

                //user language = fr, set German default lang, get german back
                var wantFRThenDEEl = UstadJSTinCanXML.getElementByLang("launch", 
                    launchableActivity, "fr", "de");
                assert.equal(wantFRThenDEEl.getAttribute("lang"), "de",
                    'Fallback to specified lang (de)');

                //user language = en, default = en, get en back
                var wantENEl = UstadJSTinCanXML.getElementByLang("launch", 
                    launchableActivity, "en");
                assert.equal(wantENEl.getAttribute("lang"),"en", 
                    "Get English back when specified as user lang");
                
                //match against partial language
                var langOnlyMatch = UstadJSTinCanXML.getElementByLang("launch",
                    launchableActivity, "en-GB");
                assert.equal(langOnlyMatch.getAttribute("lang"), "en",
                    "Matches by language code only when needed");
                
                //will match user lang instead of default lang
                var matchUserEl = UstadJSTinCanXML.getElementByLang("launch",
                    launchableActivity, "de");
                assert.equal(matchUserEl.getAttribute("lang"), "de",
                    "Match user language first");
                
                //will return the first element when nothing is matchable
                var firstElReturn = UstadJSTinCanXML.getElementByLang("launch",
                    launchableActivity, "fr", "es");
                assert.equal(firstElReturn.getAttribute("lang"), "en", 
                    "return first element when nothing matchable");
                
                tcDonefn();
            });
        });
    });
}

function testAbsoluteURLs() {
    QUnit.test("Turn relative URLs into absolute", function(assert) {
        var relativeURL = "dir/file.html";
        var currentDir = location.href.substring(0, 
                location.href.lastIndexOf("/")+1);
        assert.equal(UstadJS.makeAbsoluteURL(relativeURL),
            currentDir + relativeURL, "Relative converted to absolute URL");
        var absURL = "http://www.server.com/some/file.html";
        assert.equal(UstadJS.makeAbsoluteURL(absURL), absURL, 
            "Absolute URL remains as it was");
        
    });
}

function testURLQueryRemoval() {
    QUnit.test("Query removal from URL functions", function(assert) {
        var baseUrl = "http://www.server.com/some/file";
        var urlWithQuery = baseUrl + "?foo=bar&foo2=baa"
        
        assert.equal(UstadJS.removeQueryFromURL(baseUrl), baseUrl,
            "URL without query remains the same");
        assert.equal(UstadJS.removeQueryFromURL(urlWithQuery), baseUrl,
            "URL with query has it removed and equals base URL");
    });
}

function testRunCallback() {
    QUnit.test("Runcallback runs", function(assert) {
        var ranVal = 0;
        var myFn = function(arg) {
            ranVal = arg;
        };
        UstadJS.runCallback(myFn, this, [42]);
        assert.ok(ranVal === 42, "Runcallback runs");
    });
}

function testUstadJSGetContainer() {
    QUnit.test("Parse Manifest", function(assert) {
        var containerStr = '<?xml version="1.0"?>'
            +'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
            +'    <rootfiles>'
            +'        <rootfile full-path="EPUB/package.opf"'
            +'            media-type="application/oebps-package+xml" />'
            +'    </rootfiles>'
            +'</container>';
        var retVal = UstadJS.getContainerRootfilesFromXML(containerStr);
        assert.ok(retVal.length === 1, "Found 1 rootfile correctly");
        assert.ok(retVal[0]['full-path'] === "EPUB/package.opf",
            "Found full path attribute correctly");
        assert.ok(retVal[0]['media-type'] ==="application/oebps-package+xml",
            "Found media type correctly");
    });
}

function testUstadJSLoadOPF() {
    QUnit.test("Load OPF", function(assert) {
        assert.expect(5);
        var opfDonefn = assert.async();
        console.log("start opf test");
        $.ajax("assets/package.opf", {
            dataType  : "text"
        }).done(function(opfStr){
            console.log("loaded opf asset");
            var jsOPF = new UstadJSOPF();
            jsOPF.loadFromOPF(opfStr);
            var itemCount = 0;
            console.log("made jsopf object");
            for(var prop in jsOPF) {
                if(jsOPF.hasOwnProperty(prop)) {
                    itemCount++;
                }
            }
            assert.ok(itemCount, "Counted items");
            console.log("counted items");
            assert.ok(jsOPF.spine.length > 0, "OPF has spine");
            console.log("opf has spine");
            
            
            var coverIndex = jsOPF.getSpinePositionByHref("cover.xhtml");
            assert.ok(coverIndex === 0, "Spine has cover at index 0");
            assert.ok(jsOPF.getSpinePositionByHref(
                "notactuallyhere.xhtml")=== -1, 
                "Spine does not have file returns -1");
            assert.ok(jsOPF.title === "Bob epub", 
                "Spine loads title: Bob epub");
            console.log("done with opf tests");
            opfDonefn();
        });
    });
}

