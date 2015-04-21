/**
 * 
 */

QUnit.module("UstadJSOPDSBrowser", {
    setup: function() {
        $(".ustadjs_opdsbrowser").opdsbrowser({
            "defaulticon_acquisitionfeed": "../src/img/default-acquire-icon.png",
            "defaulticon_navigationfeed" : "../src/img/default-navigation-icon.png",
            "defaulticon_containerelement" :"../src/img/default-acquire-icon.png"
        });
    }
});

(function() {
    testUstadJSOPDSBrowser();
}());

function testUstadJSOPDSBrowser() {
    QUnit.test("UstadJSOPDSBrowser Main Tests", function(assert) {
        var donefn = assert.async();
        $.ajax("assets/shelf.opds", {
            dataType : "text"
        }).done(function(opdsStr) {
            var opdsObj = UstadJSOPDSFeed.loadFromXML(opdsStr, 
                "assets/catalog1.opds");
            
            testUstadJSOPDSBrowserNavFeed(opdsObj, assert, "#test_opdsbrowser",
                function() {
                    assert.expect(3);
                    //now try updating the status of an item
                    $("#test_opdsbrowser").opdsbrowser("updateentrystatus",
                        opdsObj.entries[0].id, $UstadJSOPDSBrowser.ACQUIRED);
                    var elArea = $("#test_opdsbrowser div[data-feed-id='"
                        + opdsObj.entries[0].id + "']");
                    var statusEl = elArea.children(".umjs_opdsbrowser_statusarea");
                    
                    /* Temporarily disabled whilst being reworked with JQM
                     * 
                    
                    assert.ok(statusEl.hasClass("umjs_opdsbrowser_elstatus_acquired"),
                        "Status area now has acquired class");
                     */
                    
                    
                    //now try setting an in progress status
                    /* Temporarily disabled whilst being reworked with JQM
                     * 
                    $("#test_opdsbrowser").opdsbrowser("updateentrystatus",
                        opdsObj.entries[1].id, $UstadJSOPDSBrowser.ACQUISITION_IN_PROGRESS,
                        {"loaded" : 50, "total" : 100});
                    
                    $("#test_opdsbrowser").opdsbrowser("updateentryprogress",
                        opdsObj.entries[1].id, {"loaded" : 75, "total" : 100});
                    
                    var elArea2 = $("#test_opdsbrowser div[data-feed-id='"
                        + opdsObj.entries[1].id + "']");
                    assert.equal(parseInt(elArea2.find("progress").attr("value")),
                        75, "Progress bar was updated");
                    */    
                    donefn();
                });
        });
        
        
        
    });
    
    
    QUnit.test("UstadJS OPDSBrowser - Acquisition Feed View", function(assert) {
        assert.expect(1);
        var donefn = assert.async();
        $.ajax("assets/acquire.opds", {
            dataType : "text"
        }).done(function(opdsStr) {
            var opdsObj = UstadJSOPDSFeed.loadFromXML(opdsStr, 
                "assets/acquire.opds");
            testUstadJSOPDSBrowserAcquisitionFeed(opdsObj, assert, 
                "#test_opdsbrowser_acquisitionfeed", donefn);
            
        });
    });
    
}

function testUstadJSOPDSBrowserAcquisitionFeed(opdsObj, assert, itemSelector, donefn2) {
    assert.expect(3);
        
    $(itemSelector).opdsbrowser(
                "setupfromfeed", opdsObj);
    
    assert.ok($(itemSelector).hasClass("umjs_opdsbrowser_acqfeed"),
        "has correct class");
    
    
    $(itemSelector).opdsbrowser("option", "containerentryselected", function(evt, data) {
        assert.ok(data.entry instanceof UstadJSOPDSEntry, "Clicking triggers event with entry");
        assert.equal(data.entry.id, opdsObj.entries[0].id, "Loaded with correct id");
        donefn2();
    });
    
    $(itemSelector + " li a").first().trigger("click");
}


/**
 * Runs the standard set of tests against a given opds feed 
 * 
 * @param {UstadJSOPDSFeed} opdsObj The OPDS Feed we are handling
 * @param {QUnit} assert from the test run
 * @param {function} donefn function to call when done (async)
 * @param {string} itemSelector JQuery item selector for what's running the frame
 */
function testUstadJSOPDSBrowserNavFeed(opdsObj, assert, itemSelector, donefn) {
    assert.expect(3);
    assert.ok($(itemSelector).hasClass("umjs_opdsbrowser"));
    $(itemSelector).opdsbrowser("setupfromfeed", opdsObj);
    assert.ok($(itemSelector).opdsbrowser("option", "_opdsFeedObj") === opdsObj,
        "OPDS Object is loaded");
    
    var setTitle = $(itemSelector).children(".umjs_opdsbrowser_title").text();
    assert.ok(setTitle === opdsObj.title, "Title correctly set");
    
    $(itemSelector).opdsbrowser("option", "feedselected", function() {
        donefn();
    });
    
    $(itemSelector + " li a").first().trigger("click");
    
    
}

