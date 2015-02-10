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
            testUstadJSOPDSBrowserFromObj(opdsObj, assert, donefn, 
                "#test_opdsbrowser");
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
function testUstadJSOPDSBrowserFromObj(opdsObj, assert, donefn, itemSelector) {
    assert.expect(3);
    assert.ok($("#test_opdsbrowser").hasClass("umjs_opdsbrowser"));
    $(itemSelector).opdsbrowser("setupfromfeed", opdsObj);
    assert.ok($(itemSelector).opdsbrowser("option", "_opdsFeedObj") === opdsObj,
        "OPDS Object is loaded");
    
    var setTitle = $(itemSelector).children(".umjs_opdsbrowser_title").text();
    assert.ok(setTitle === opdsObj.title, "Title correctly set");
    
    donefn();
}

