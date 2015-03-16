QUnit.module("UstadJS", {
    setup: function() {
        $("#test_microemu").microemu();
    }
});

var UstadMicroTestOpts = {
    downButtonPos: {
        x: 64,
        y: 174
    },
    upButtonPos: {
        x: 62,
        y: 151
    },
    selectButtonPos: {
        x: 70,
        y: 160
    }
};


(function() {    
    testUstadJSMicroEmu();
}());

function testUstadJSMicroEmu() {
    QUnit.test("MicroEmu setup tests", function(assert) {
        var microSetupDoneFn = assert.async();
        assert.expect(19);
        
        
        $("#test_microemu").microemu("loadmicroemuskin", 
            "assets/microdevice/minimum/device.xml", {}, function() {
                var imgSrcs = $("#test_microemu").microemu("option", "imgSrcs");
                assert.ok(imgSrcs.normal, "Appears to have loaded images");
                var width = $("#test_microemu").microemu("option", "width");
                var height = $("#test_microemu").microemu("option", "height");
                
                assert.ok(width > 0, "Width is " + width);
                assert.ok(height > 0, "Height is " + height);
                
                
                //test events
                var canvasOffset = $(this.canvas).offset();
                
                var fakeEvt = {
                    "pageX": 60 +canvasOffset.left,
                    "pageY": 260 + canvasOffset.top,
                    "target" : $("#test_microemu").microemu("getcanvas"),
                    preventDefault: function() {}
                };
                
                //hover over button
                $("#test_microemu").microemu("handleMouseMove", fakeEvt);
                var button0 = $("#test_microemu").microemu("getbuttonbyname", "0");
                assert.ok(button0.state === "over", "On Mouse move state is over");
                
                //mouse press
                $("#test_microemu").microemu("handleMouseDown", fakeEvt);
                assert.ok(button0.state === 
                    "pressed", "on mouse down state is pressed");
                
                $("#test_microemu").microemu("handleMouseUp", fakeEvt);
                assert.ok(button0.state === "normal", 
                    "on mouse up state is normal");
                
                //test some util edge cases
                assert.ok($("#test_microemu").microemu("getbuttonbyname", 
                    "nobuttonhere") === null, 
                    "GetButtonByName returns null if no match");
                
                //test some util edge cases
                assert.ok($("#test_microemu").microemu("getbuttonforposition", 
                    0, 0) === -1, 
                    "_getButtonForPosition returns -1 if no match");
                
                
                //test paintable area
                var paintableDiv = $("#test_microemu").microemu(
                    "paintablearea");
                assert.ok(paintableDiv, "Paintable area is available");
                
                var iframeTester = $("<iframe/>", {
                    "width" : $(paintableDiv).width(),
                    "height" :  $(paintableDiv).height()
                });
                iframeTester.css("border", "0px").css("margin", "0px");
                $(paintableDiv).empty().append(iframeTester);
                
                iframeTester.one("load", function(evt) {
                    $("#test_microemu").microemu("setselectablecontainer",
                        iframeTester.get(0).contentDocument);
                        
                    //now test handling elements - click the down button
                    var fakeEvtDown = {
                        "pageX": UstadMicroTestOpts.downButtonPos.x
                                +canvasOffset.left,
                        "pageY": UstadMicroTestOpts.downButtonPos.y 
                                + canvasOffset.top,
                        "target" : $("#test_microemu").microemu("getcanvas"),
                        preventDefault: function() {}
                    };
                    $("#test_microemu").microemu("handleMouseClick", fakeEvtDown);
                    var selectableItems = $("#test_microemu").microemu(
                        "getselectableelements");
                    var selectedItem = $("#test_microemu").microemu(
                        "getselectedindex");
                    assert.equal(selectedItem, 1, 
                        "On mouse click of down arrow, next time selected");
                    
                    //test that when clicking down as many buttons as we have we land at item 0
                    for(var i = 1; i < selectableItems.length; i++) {
                        $("#test_microemu").microemu("handleMouseClick", fakeEvtDown);
                    }
                    assert.equal($("#test_microemu").microemu(
                        "getselectedindex"), 0, "Clicking down wraps to 0");
                    
                    //test that going up will put that to the last one
                    var fakeEvtUp = {
                        "pageX": UstadMicroTestOpts.upButtonPos.x
                                +canvasOffset.left,
                        "pageY": UstadMicroTestOpts.upButtonPos.y 
                                + canvasOffset.top,
                        "target" : $("#test_microemu").microemu("getcanvas"),
                        preventDefault: function() {}
                    };
                    
                    $("#test_microemu").microemu("handleMouseClick", fakeEvtUp);
                    assert.equal($("#test_microemu").microemu(
                        "getselectedindex"), selectableItems.length - 1, 
                        "Clicking up wraps to last component");
                        
                        
                    //test handling keyboard events on selectable items
                    var fakeKeyDownEvt = {
                        which: 40,
                        "target" : $("#test_microemu").microemu("getcanvas"),
                        preventDefault: function() {}
                    };
                    $("#test_microemu").microemu("handleSelectableElementKeyDown",
                        fakeKeyDownEvt);
                    assert.equal($("#test_microemu").microemu("getbuttonbyname",
                        "DOWN").state, "pressed", 
                        "keyDown on down button state is pressed");
                        
                    $("#test_microemu").microemu("handleSelectableElementKeyUp",
                        fakeKeyDownEvt);
                    assert.equal($("#test_microemu").microemu("getbuttonbyname",
                        "DOWN").state, "normal", 
                        "after keyUp on down button state is norm");
                    
                    //selection is at last item, pressing down should wrap
                    assert.equal($("#test_microemu").microemu(
                        "getselectedindex"), 0, 
                        "Pressing keyboard event moves selection down");
                    
                    var fakeEvtSelect = {
                        "pageX": UstadMicroTestOpts.selectButtonPos.x
                                +canvasOffset.left,
                        "pageY": UstadMicroTestOpts.selectButtonPos.y 
                                + canvasOffset.top,
                        "target" : $("#test_microemu").microemu("getcanvas"),
                        preventDefault: function() {}
                    };
                    
                    $("#test_microemu").microemu("handleMouseClick", 
                        fakeEvtSelect);
                    assert.ok(
                        $("#test_microemu").microemu("getselectedelement").checked,
                        "After clicking middle button item gets selected");
                    //try 'clicking' on menubuar
                    
                    //test getindexofbutton
                    var upButton = $("#test_microemu").microemu(
                        "getbuttonforposition", UstadMicroTestOpts.upButtonPos.x,
                        UstadMicroTestOpts.upButtonPos.y);
                    var upButtonIndex =  $("#test_microemu").microemu(
                        "getindexofbutton", upButton);
                    assert.equal(
                        $("#test_microemu").microemu("getbuttonbyindex").name,
                        upButton.name, "Button index fns OK");
                    
                    //test using the menubar - move down - change selection
                    $("#test_microemu").microemu("handleSelectableElementKeyDown",
                        fakeKeyDownEvt);
                    var selectTargetEl = $("#test_microemu").find(
                        ".umjs-microemu-menu-middle").get(0);
                    var fakeMenubarEvt = {
                        target: selectTargetEl,
                        preventDefault: function(){}
                    };
                    
                    //move down
                    $("#test_microemu").microemu("handleMouseClick", fakeEvtDown);
                    
                    $("#test_microemu").microemu("handleMenuBarMouseDown", 
                        fakeMenubarEvt);
                    assert.equal($("#test_microemu").microemu("getbuttonbyname",
                        "SELECT").state, "pressed",
                        "Mousedown on menubar select presses select");
                    
                    
                    $("#test_microemu").microemu("handleMenuBarMouseUp", 
                        fakeMenubarEvt);
                    
                    assert.equal( 
                        $("#test_microemu").microemu("getselectedelement").checked,
                        true, "Clicking on select on menubar selects item");
                    
                    setTimeout(microSetupDoneFn, 1000);
                });
                iframeTester.attr("src", 
                    "test-microemu-paintablearea-frame.html");
            }, function(err) {

            });
    });
    
}

