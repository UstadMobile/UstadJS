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


QUnit.module("UstadJS", {
    setup: function() {
        $("#test_opubframe").opubframe();
    }
});

(function() {
    testUstadJSOpubFrameCreate();
}());

/**
 * Test creation of the opub frame
 */
function testUstadJSOpubFrameCreate() {
   
    QUnit.test("Handle frame query parameters", function(assert) {
        assert.expect(2);
       
        $("#test_opubframe").opubframe("option", "page_query_params",
            "foo=bar&bar=foo2");
        var adjURL = $("#test_opubframe").opubframe("appendParamsToURL", 
            "index.html");
        assert.equal(adjURL, "index.html?foo=bar&bar=foo2");
        $("#test_opubframe").opubframe("option", "page_query_params", null);
        adjURL = $("#test_opubframe").opubframe("appendParamsToURL", 
            "index.html");
        assert.equal(adjURL, "index.html");
    });
   
   
    QUnit.test("OPub Frame load", function(assert) {
        assert.expect(5);
        var donefn = assert.async();
        
        $("#test_opubframe").opubframe("option", "page_query_params",
            "foo=bar&bar=foo2");
        
        $("#test_opubframe").opubframe("loadfrommanifest", "epubs/epubdir34", 0, function(result) {
            assert.ok(result === "success", "Loaded container");
            
            $("#test_opubframe").opubframe("option", "height", "500px");
            assert.ok($("#test_opubframe").css("height") === "500px",
                "Set height on opub frame itself OK");
            var iframeHeight = $("#test_opubframe iframe").outerHeight(false);
            var elHeight = $("#test_opubframe").outerHeight(false);
            var heightDiff = elHeight - iframeHeight;
            assert.ok(elHeight >= iframeHeight && heightDiff < 10,
                "Height of iframe within is OK");
            
            //assert.ok($("#test_opubframe iframe").css("height") === "500px",
            //    "Set height on opub nested iframe OK");
            
            assert.ok(
                $("#test_opubframe").opubframe("option", "spine_pos") === 0,
                "Spine at Pos 0");
            $("#test_opubframe").opubframe("go", 1, function(result) {
                assert.ok(result === "success", 
                    "Going to next page returns success");
                donefn();
            });
            
        });
    });
}

