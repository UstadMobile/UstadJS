/**
 * 
 */

$(document).on("mobileinit", function() {
    $.ajax("../assets/shelf.opds", {
        dataType : "text"
    }).done(function(opdsStr) {
        var opdsObj = UstadJSOPDSFeed.loadFromXML(opdsStr, 
            "../assets/shelf.opds");
        $(".ustadjs_opdsbrowser").opdsbrowser({
            "defaulticon_acquisitionfeed": "../../src/img/default-acquire-icon.png",
            "defaulticon_navigationfeed" : "../../src/img/default-navigation-icon.png",
            "defaulticon_containerelement" :"../../src/img/default-acquire-icon.png"
        });
        $("#test_opdsbrowser").opdsbrowser("setupnavigationfeedview", 
            opdsObj).enhanceWithin();
    });
});
