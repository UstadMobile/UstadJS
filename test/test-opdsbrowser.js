/**
 * 
 */

QUnit.module("UstadJSOPDSBrowser", {
    setup: function() {
        $("#test_opdsbrowser").opdsbrowser({
            "defaulticon_acquisitionfeed": "../src/img/default-acquire-icon.png",
            "defaulticon_navigationfeed" : "../src/img/default-navigation-icon.png"
        });
    }
});

(function() {
    testUstadJSOPDSBrowser();
}());

function testUstadJSOPDSBrowser() {
    QUnit.test("UstadJSOPDSBrowser running", function(assert) {
        var donefn = assert.async();
        $.ajax("assets/shelf.opds", {
            dataType : "text"
        }).done(function(opdsStr) {
            var opdsObj = UstadJSOPDSFeed.loadFromXML(opdsStr, 
                "assets/catalog1.opds");
            
            testUstadJSOPDSBrowserFromObj(opdsObj, assert, "#test_opdsbrowser",
                function() {
                    assert.expect(5);
                    //now try updating the status of an item
                    $("#test_opdsbrowser").opdsbrowser("updateentrystatus",
                        opdsObj.entries[0].id, $UstadJSOPDSBrowser.ACQUIRED);
                    var elArea = $("#test_opdsbrowser div[data-feed-id='"
                        + opdsObj.entries[0].id + "']");
                    var statusEl = elArea.children(".umjs_opdsbrowser_statusarea");
                    assert.ok(statusEl.hasClass("umjs_opdsbrowser_elstatus_acquired"),
                        "Status area now has acquired class");
                        
                    //now try setting an in progress status
                    $("#test_opdsbrowser").opdsbrowser("updateentrystatus",
                        opdsObj.entries[1].id, $UstadJSOPDSBrowser.ACQUISITION_IN_PROGRESS,
                        {"loaded" : 50, "total" : 100});
                    
                    $("#test_opdsbrowser").opdsbrowser("updateentryprogress",
                        opdsObj.entries[1].id, {"loaded" : 75, "total" : 100});
                    
                    var elArea2 = $("#test_opdsbrowser div[data-feed-id='"
                        + opdsObj.entries[1].id + "']");
                    assert.equal(parseInt(elArea2.find("progress").attr("value")),
                        75, "Progress bar was updated");
                        
                    donefn();
                });
        });
        
        
        
    });
}

/**
 * Runs the standard set of tests against a given opds feed 
 * 
 * @param {UstadJSOPDSFeed} opdsObj The OPDS Feed we are handling
 * @param {QUnit} assert from the test run
 * @param {function} donefn function to call when done (async)
 * @param {string} itemSelector JQuery item selector for what's running the frame
 */
function testUstadJSOPDSBrowserFromObj(opdsObj, assert, itemSelector, donefn) {
    assert.expect(3);
    assert.ok($(itemSelector).hasClass("umjs_opdsbrowser"));
    $(itemSelector).opdsbrowser("setupfromfeed", opdsObj);
    assert.ok($(itemSelector).opdsbrowser("option", "_opdsFeedObj") === opdsObj,
        "OPDS Object is loaded");
    
    var setTitle = $(itemSelector).children(".umjs_opdsbrowser_title").text();
    assert.ok(setTitle === opdsObj.title, "Title correctly set");
    
    $(itemSelector).opdsbrowser("option", "acquisitionfeedselected", function() {
        donefn();
    });
    
    $(itemSelector + " .umjs_opdsbrowser_acquisitionfeed_element").first().trigger("click");
    
    
}

