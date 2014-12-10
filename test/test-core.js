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
    testUstadJSLoadOPF();
    testRunCallback();
}());

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
        assert.expect(4);
        var donefn = assert.async();
        
        $.ajax("assets/package.opf", {
            dataType  : "text"
        }).done(function(opfStr){
            var jsOPF = new UstadJSOPF();
            jsOPF.loadFromOPF(opfStr);
            var itemCount = 0;
            for(var prop in jsOPF) {
                if(jsOPF.hasOwnProperty(prop)) {
                    itemCount++;
                }
            }
            assert.ok(itemCount, "Counted items");
            assert.ok(jsOPF.spine.length > 0, "OPF has spine");
            var coverIndex = jsOPF.getSpinePositionByHref("cover.xhtml");
            assert.ok(coverIndex === 0, "Spine has cover at index 0");
            assert.ok(jsOPF.getSpinePositionByHref(
                "notactuallyhere.xhtml")=== -1, 
                "Spine does not have file returns -1");
            donefn();
        });
    });
}
