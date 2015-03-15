QUnit.module("UstadJS", {
    setup: function() {
        $("#test_microemu").microemu();
    }
});


(function() {
    testUstadJSMicroEmu();
}());

function testUstadJSMicroEmu() {
    QUnit.test("MicroEmu setup tests", function(assert) {
        var microSetupDoneFn = assert.async();
        assert.expect(8);
        
        
        $("#test_microemu").microemu("loadmicroemuskin", 
            "assets/microdevice/minimum/device.xml", {}, function() {
                var imgSrcs = $("#test_microemu").microemu("option", "imgSrcs");
                assert.ok(imgSrcs.normal, "Appears to have loaded images");
                var width = $("#test_microemu").microemu("option", "width");
                var height = $("#test_microemu").microemu("option", "height");
                
                assert.ok(width > 0, "Width is " + width);
                assert.ok(height > 0, "Height is " + height);
                
                
                //test events
                var fakeEvt = {
                    "offsetX": 60,
                    "offsetY": 260,
                    preventDefault: function() {}
                };
                
                //hover over button
                $("#test_microemu").microemu("handleMouseMove", fakeEvt);
                var button0 = $("#test_microemu").microemu("getbuttonbyname", "0");
                assert.ok(button0.state === "over", "On Mouse move state is over");
                
                //mouse press
                $("#test_microemu").microemu("handleMouseDown", fakeEvt);
                assert.ok(button0.state === "pressed", "on mouse down state is pressed");
                
                $("#test_microemu").microemu("handleMouseUp", fakeEvt);
                assert.ok(button0.state === "normal", "on mouse up state is normal");
                
                //test some util edge cases
                assert.ok($("#test_microemu").microemu("getbuttonbyname", 
                    "nobuttonhere") === null, 
                    "GetButtonByName returns null if no match");
                
                //test some util edge cases
                assert.ok($("#test_microemu").microemu("getbuttonforposition", 
                    0, 0) === -1, 
                    "_getButtonForPosition returns -1 if no match");
                
                
                setTimeout(microSetupDoneFn, 1000);
            }, function(err) {

            });
    });
    
}

