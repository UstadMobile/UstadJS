/* 
 * A widget for displaying content in a feature phone like skin using the 
 * MicroEmu format as per:
 
  http://www.petitpub.com/labs/j2me/me/tutorial/
  and
  http://pyx4me.com/snapshot/microemu/skin.html
 */



var $UstadJSMicroEmu = {
    IMG_STATES : ["normal", "over", "pressed"],
    
    KEYCODES_TO_BUTTONNAME: {
        "40" : "DOWN",
        "38" : "UP",
        "13" : "SELECT"
    },
    
    KEYCODE_DOWN : 40,
    
    KEYCODE_UP : 38,
    
    updateCanvas: function (func) {
        var fn2Use = window.requestAnimationFrame || 
            window.webkitRequestAnimationFrame || 
            window.msRequestAnimationFrame || 
            window.amozRequestAnimationFrame || 
            (function (func){setTimeout(func, 16.666);});

        fn2Use(func);
    }
};

var $UstadJSMicroEmuButton = function(name) {
    this.shape = null;
    this.name = name;
    
    this.state = 0;
};

$UstadJSMicroEmuButton.prototype.containsPoint = function(x, y) {
    return this.shape.containsPoint(x,y);
};

/**
         * Add a button from the relevant XML node from device.xml
         * 
         * @param {type} xmlEl
         * @returns {undefined}
         */
$UstadJSMicroEmuButton.makeButtonObjFromXML = function(xmlEl) {
    var buttonName = xmlEl.getAttribute("name");
    var buttonObj = new $UstadJSMicroEmuButton(buttonName);
    if(xmlEl.getElementsByTagName("polygon").length > 0) {
        var polygonEl = xmlEl.getElementsByTagName("polygon")[0];
        var pointEls = polygonEl.getElementsByTagName("point");
        var pts = [];
        for(var i = 0; i < pointEls.length; i++) {
            pts.push({
                x : parseInt(pointEls[i].getAttribute("x")),
                y : parseInt(pointEls[i].getAttribute("y"))
            });
        }
        buttonObj.shape = new $UstadJSMicroEmuButton.Polygon(pts);
    }else if(xmlEl.getElementsByTagName("rectangle").length > 0) {
        var rectEl = xmlEl.getElementsByTagName("rectangle")[0];
        buttonObj.shape = $UstadJSMicroEmuButton.Rectangle.makeFromXMLEl(rectEl);
    }

    return buttonObj;
};

$UstadJSMicroEmuButton.Rectangle = function(coords) {
    this.x = coords.x;
    this.y = coords.y;
    this.width = coords.width;
    this.height = coords.height;
};

/**
 * Make a rectangle object from an xml element with x, y, width, height
 * params as is found in device.xml files for MicroEmu
 * 
 * @param {type} xmlEl
 * @returns {undefined}
 */
$UstadJSMicroEmuButton.Rectangle.makeFromXMLEl = function(xmlEl) {
    var attrs = ["x", "y", "width", "height"];
    var coords = {};
    for(var j = 0; j < attrs.length; j++) {
        coords[attrs[j]] = 
            parseInt(xmlEl.getElementsByTagName(attrs[j])[0].textContent);
    }
    return new $UstadJSMicroEmuButton.Rectangle(coords);
};

$UstadJSMicroEmuButton.Rectangle.prototype.containsPoint = function(x, y) {
    return (x >= this.x && x <= (this.x + this.width)) &&
        (y >= this.y && y <= (this.y + this.height));
};

/**
 * 
 * @param {Array} coords Array of objects with x and y (.x and .y) integer coordinates
 */
$UstadJSMicroEmuButton.Polygon = function(coords) {
    this.coords = coords;
};

/**
 * Borrowed from http://jsfromhell.com/math/is-point-in-poly
 * @param {type} x
 * @param {type} y
 * @returns {Boolean}
 */
$UstadJSMicroEmuButton.Polygon.prototype.containsPoint = function(x, y) {
    /* jshint ignore:start */
    var poly = this.coords;
    var pt = {"x" : x, "y" : y};
    for(var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i) {
        ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y)) && 
        (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x) && 
        (c = !c);
    }
    return c;
    /* jshint ignore:end */
};


(function($){
    
    
    
    /**
     * Widget to create an UstadJSMicroEMU instance
     * 
     * Example:
     * 
     * $(".selector").microemu("loadmicroemuskin", 
     *  "/url/to/device.xml", {}, function() {
     *      //success fn when loaded - needs to wait until the skin file and images have loaded
     *      
     *      //get the div positioned on the paintable screen area
     *      var paintableScreenDiv = $(".selector").microemu("paintablearea");
     *      
     *      paintableScreenDiv.append("<iframe src...");
     *      
     *      //now set where selectable components are that the arrows control focus
     *      $(".selector").microemu("setselectablecontainer", 
     *          someIframe.contentDocument);
     *      
     *  }, function(err) {
     *  
     *  });
     * 
     * 
     *
     * @class UstadJSOPDSBrowser
     * @memberOf jQuery.fn
     */
    $.widget("umjs.microemu", {
        
        loadedEvtFired: false,
        
        _setupCallbackSuccessFn: null,
        
        _setupCallbackFailFn : null,
        
        _buttons: [],
        
        _mouseOverButtonIndex: -1,
        
        _mousePressedKeyIndex: -1,
        
        /**
         * The index of the element in selectableElementContainer that has 
         * focus
         * @type {number}
         */
        focusedElementIndex: -1,
        
        /** The selectable elements found in selectableElementContainer */
        selectableElements: [],
        
        options : {
            /** The XML Document with the MicroEmu skin descriptor */
            microEMUSkinXML: null,
            
            /** The absolute URL based from which assets are loaded */ 
            assetBaseURL: "",
            
            imgSrcs: {},
            
            imgs: {},
            
            imgsLoadState: {},
            
            /** Main HTML5 Canvas to draw on*/
            canvas : null,
            
            width: 0,
            
            height: 0,
            
            screenAreaElement: null,
            
            menubarAreaElement: null,
            
            /** Element that shows the virtual phone screen */
            paintableElement: null,
            
            /** Elements that can be selected are looked for in here */
            selectableContainer: null ,
            
            selectableElementSelector: "input, button",
            
            menubutton_labels: {
                "left" : "Options",
                /* Default for the form in case no selectable item is focused */
                "middle" : "OK",
                "right" : "Opt1",
                "select" : "Select"
            }
        },
        
        _create: function() {
            if(!this.element.hasClass("umjs-microemu")) {
                this.element.addClass("umjs-microemu");
            }
        },
        
        getbuttonbyname: function(buttonName) {
            for(var i = 0; i < this._buttons.length; i++) {
                if(this._buttons[i].name === buttonName) {
                    return this._buttons[i];
                }
            }
            
            return null;
        },
        
        getbuttonbyindex: function(index) {
            return this._buttons[index];
        },
        
        getindexofbutton: function(button) {
            for(var i = 0; i < this._buttons.length; i++) {
                if(this._buttons[i].name === button.name) {
                    return i;
                }
            }
        },
        
        /**
         * 
         * @param {string|Document} skin
         * @param {Object} options
         * @returns {undefined}
         */
        setupmicroemuskin: function(skin, options) {
            skin = UstadJS.ensureXML(skin);
            this.options.microEMUSkinXML = skin;
            
            this.options.imgSrcs = {};
            this.options.imgs = {};
            this.options.imgsLoadState = {};
            
            this._buttons = [];
            var buttonEls = skin.getElementsByTagName("button");
            for(var i = 0; i < buttonEls.length; i++) {
                var button = $UstadJSMicroEmuButton.makeButtonObjFromXML(
                    buttonEls[i]);
                this._buttons.push(button);
            }
            
            buttonEls = skin.getElementsByTagName("softbutton");
            for(var j = 0; j < buttonEls.length; j++) {
                var button1 = $UstadJSMicroEmuButton.makeButtonObjFromXML(
                    buttonEls[j]);
                this._buttons.push(button1);
            }
            
            for(var k = 0; k < $UstadJSMicroEmu.IMG_STATES.length; k++) {
                var currentImgName = $UstadJSMicroEmu.IMG_STATES[k];
                
                var imgSrc = skin.querySelector("img[name='" + 
                    currentImgName + "']").getAttribute('src');
                var imgSrcAbs = UstadJS.resolveURL(this.options.assetBaseURL, 
                    imgSrc);
                this.options.imgSrcs[currentImgName] = imgSrcAbs;
                
                var img = document.createElement("img");
                img.setAttribute("data-phoneimg-type", currentImgName);
                
                this.options.imgs[currentImgName] = img;
                this.options.imgsLoadState[currentImgName] = 0;
                
                img.onload = this.handlePhoneImageLoaded.bind(this);
                img.src = imgSrcAbs;
            }
        },
        
        
        
        _handleAllImagesLoaded: function() {
            if(this.loadedEvtFired) {
                return;
            }
            this.loadedEvtFired = true;
            
            this.options.width = this.options.imgs.normal.width;
            this.options.height = this.options.imgs.normal.height;
            
            //now create the canvas
            this.canvas = document.createElement("canvas");
            this.canvas.setAttribute("width", this.options.width);
            this.canvas.setAttribute("height", this.options.height);
            this.element.append(this.canvas);
            this.paintCanvas();
            
            this.canvas.addEventListener("mousemove", 
                this.handleMouseMove.bind(this), true);
            
            this.canvas.addEventListener("mousedown",
                this.handleMouseDown.bind(this), true);
                
            this.canvas.addEventListener("mouseup",
                this.handleMouseUp.bind(this), true);
            
            this.canvas.addEventListener("click",
                this.handleMouseClick.bind(this), true);
            
            var evt = jQuery.Event( "loaded", { microemu: this} );
            $(this.element).trigger("loaded", evt);
            
            //setup the paintable element
            this.paintableElement = document.createElement("div");
            this.paintableElement.style.position = "absolute";
            var displayEl = this.options.microEMUSkinXML.querySelector("display");
            var displayRect = $UstadJSMicroEmuButton.Rectangle.makeFromXMLEl(
                this.options.microEMUSkinXML.querySelector("display > rectangle"));
            
            var paintableRect = $UstadJSMicroEmuButton.Rectangle.makeFromXMLEl(
                this.options.microEMUSkinXML.querySelector("display > paintable"));
            
            this.paintableElement.style.marginLeft = 
                (displayRect.x + paintableRect.x) + "px";
            this.paintableElement.style.marginTop =
                (displayRect.y + paintableRect.y) + "px";
            this.paintableElement.style.width = paintableRect.width + "px";
            this.paintableElement.style.height = paintableRect.height + "px";
            
            //this.paintableElement.style.border = "1px solid black";
            
            this.paintableElement.style.zIndex = 10000;
            this.paintableElement.innerHTML = "HI WORLD";
            
            //now make the menubar element
            this.menubarElement = document.createElement("div");
            this.menubarElement.style.position = "absolute";
            this.menubarElement.style.marginLeft = 
                (displayRect.x + paintableRect.x) + "px";
            this.menubarElement.style.marginTop =
                (displayRect.y + paintableRect.y + paintableRect.height) + "px";
            this.menubarElement.style.width = paintableRect.width + "px";
            this.menubarElement.style.height = displayRect.height - 
                (paintableRect.height + paintableRect.y) + "px";
            var menuTableEl = $("<table/>", {
                class: "umjs-microemu-menutable",
                width : "100%"
            });
            menuTableEl.css("height", this.menubarElement.style.height);
            $(menuTableEl).get(0).addEventListener("click", (function(evt) {
                this._checkfocus();
            }).bind(this), false);
            
            var menuTableTr = $("<tr/>",{
                class: "umjs-microemu-menutable-tr"
            }).appendTo(menuTableEl);
            
            
            var menuAreas = ["left", "middle", "right"];
            var keyMaps = ["SOFT1", "SELECT", "SOFT2"];
            
            for(var i = 0; i < menuAreas.length; i++) {
                var menuTd = $("<td/>", {
                    class: "umjs-microemu-menuarea umjs-microemu-menu-" +
                            menuAreas[i]
                }).appendTo(menuTableTr).text(
                    this.options.menubutton_labels[menuAreas[i]]);
                $(menuTd).attr("data-umjs-microemu-key", keyMaps[i]);
                $(menuTd).get(0).addEventListener("mousedown",
                    this.handleMenuBarMouseDown.bind(this), true);
                $(menuTd).get(0).addEventListener("mouseup",
                    this.handleMenuBarMouseUp.bind(this), true);
            }
            
            $(this.menubarElement).append(menuTableEl);
            
            $(this.element).prepend(this.paintableElement);
            $(this.paintableElement).after(this.menubarElement);
            
            UstadJS.runCallback(this._setupCallbackSuccessFn, this, []);
            
            this._setupCallbackSuccessFn = null;
            this._setupCallbackFailFn = null;
        },
        
        handleMenuBarMouseDown: function(evt) {
            evt.preventDefault();
            var evtObj = $.Event("phonebuttonpress", {
                "target" : this.element,
            });
            var buttonName = evt.target.getAttribute("data-umjs-microemu-key");
            var buttonObj = this.getbuttonbyname(buttonName);
            var buttonIndex = this.getindexofbutton(buttonObj);
            
            this._setMousePressedButtonIndex(buttonIndex);
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        handleMenuBarMouseUp: function(evt) {
            evt.preventDefault();
            var buttonName = evt.target.getAttribute("data-umjs-microemu-key");
            var buttonObj = this.getbuttonbyname(buttonName);
            this._setMousePressedButtonIndex(-1);

            
            var evtObj = $.Event("phonebuttonpress", {
                "target" : this.element,
                
            });
            
            evtObj.buttonName = buttonName;
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
            this.handlePhoneButtonPress(evtObj);
        },
        
        /**
         * Find the button from an array which is at a given position
         * 
         * @param {number} x 
         * @param {number} y
         * @param {Array<$UstadJSMicroEmuButton>} Array of buttons to look in
         * @returns {number}
         */
        getbuttonforposition: function(x, y, buttonArr) {
            buttonArr = (typeof buttonArr !== "undefined") ? buttonArr : this._buttons;
            for(var i = 0; i < this._buttons.length; i++) {
                if(buttonArr[i].containsPoint(x, y)) {
                    return i;
                }
            }
            
            return -1;
        },
        
        getOffsetPosForEvt: function(evt) {
            return {
                x: evt.pageX - $(evt.target).offset().left,
                y : evt.pageY - $(evt.target).offset().top
            };
        },
        
        handleMouseMove: function(evt) {
            evt.preventDefault();
            var mousePos = this.getOffsetPosForEvt(evt);
            this._mouseOverButtonIndex = this.getbuttonforposition(mousePos.x,
                mousePos.y, this._buttons);
            for(var i = 0; i < this._buttons.length; i++) {
                if(i === this._mouseOverButtonIndex && this._buttons[i].state !== "pressed") {
                    this._buttons[i].state = "over";
                }else {
                    this._buttons[i].state = "normal";
                }
            }
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        handleMouseDown: function(evt) {
            evt.preventDefault();
            var mousePos = this.getOffsetPosForEvt(evt);
            var newPress = this.getbuttonforposition(mousePos.x,
                mousePos.y, this._buttons);
            
            this._setMousePressedButtonIndex(newPress);
            
            
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        _setMousePressedButtonIndex: function(newIndex) {
            if(this._mousePressedKeyIndex !== -1) {
                var pressedButton = this._buttons[this._mousePressedKeyIndex];
                if(pressedButton.state === "pressed") {
                    pressedButton.state = "normal";
                }
            }
            
            if(newIndex !== -1) {
                var newPressedButton = this._buttons[newIndex];
                newPressedButton.state = "pressed";
            }
            
            this._mousePressedKeyIndex = newIndex;
        },
        
        handleMouseUp: function(evt) {
            evt.preventDefault();
            if(this._mousePressedKeyIndex !== -1) {
                this._buttons[this._mousePressedKeyIndex].state = "normal";
                this._mousePressedKeyIndex = -1;
            }
            
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        handleMouseClick: function(evt) {
            evt.preventDefault();
            var mousePos = this.getOffsetPosForEvt(evt);
            var pressedButtonIndex = this.getbuttonforposition(mousePos.x,
                mousePos.y);
            var pressedButton = this._buttons[pressedButtonIndex];
            if(pressedButton) {
                var evtObj = $.Event("phonebuttonpress", {
                    "target" : this.element,
                });
                evtObj.buttonName = pressedButton.name;
                this.handlePhoneButtonPress(evtObj);
            }
            
            this._checkfocus();
        },
        
        handlePhoneImageLoaded: function(evt) {
            var imgEl = evt.target;
            var imgTypeName = imgEl.getAttribute("data-phoneimg-type");
            this.options.imgsLoadState[imgTypeName] = 1;
            
            var loadCount = 0;
            for(var i = 0; i < $UstadJSMicroEmu.IMG_STATES.length; i++) {
                if(this.options.imgsLoadState[imgTypeName] === 1) {
                    loadCount++;
                }
            }
            
            if(loadCount === $UstadJSMicroEmu.IMG_STATES.length) {
                this._handleAllImagesLoaded();
            }
        },
        
        /**
         * Handle when the user has pressed a phone button
         * 
         * @param {type} evt
         * @returns {undefined}
         */
        handlePhoneButtonPress: function(evt) {
            var hasSelectableElements = this.selectedElementIndex !== -1;
            if(hasSelectableElements) {
                var selectedElement = this.selectableElements[
                    this.selectedElementIndex];
                if(evt.buttonName === "UP" || evt.buttonName === "DOWN") {
                    var increment = evt.buttonName === "UP" ? -1 : 1;
                    this.selectedElementIndex += increment;
                    if(this.selectedElementIndex < 0) {
                        this.selectedElementIndex = 
                        this.selectableElements.length-1;
                    }else if(this.selectedElementIndex >= this.selectableElements.length) {
                        this.selectedElementIndex = 0;
                    }

                    $(this.selectableElements[
                        this.selectedElementIndex]).focus();
                }else if(evt.buttonName === "SELECT") {
                    $(selectedElement).trigger("click");
                }
            }
        },
        
        handleSelectableElementKeyDown: function(evt) {
            evt.preventDefault();
            var button = null;
            var whichStr = ""+evt.which;
            if($UstadJSMicroEmu.KEYCODES_TO_BUTTONNAME[whichStr]) {
                button = this.getbuttonbyname(
                    $UstadJSMicroEmu.KEYCODES_TO_BUTTONNAME[whichStr]);
            }
            
            if(button) {
                button.state = "pressed";
                $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
            }
        },
        
        handleSelectableElementKeyUp: function(evt) {
            evt.preventDefault();
            
            var button = null;
            var whichStr = ""+evt.which;
            if($UstadJSMicroEmu.KEYCODES_TO_BUTTONNAME[whichStr]) {
                button = this.getbuttonbyname(
                    $UstadJSMicroEmu.KEYCODES_TO_BUTTONNAME[whichStr]);
            }
            
            if(button) {
                button.state = "normal";
                $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
                var evtObj = $.Event("phonebuttonpress", {
                    "target" : this.element
                });
                evtObj.buttonName = button.name;
                this.handlePhoneButtonPress(evtObj);
            }
            
        },
        
        setselectablecontainer: function(selectableContainer) {
            this.selectableContainer = selectableContainer;
            this.updateselectable();
        },
        
        /**
         * When the contents of the selectable container change - run this
         * 
         * @returns {undefined}
         */
        updateselectable: function() {
            this.selectableElements = $(this.selectableContainer).find(
                this.options.selectableElementSelector);
            if(this.selectableElements.length > 0) {
                this.selectedElementIndex = 0;
                for(var i = 0; i < this.selectableElements.length; i++) {
                    this.selectableElements[i].onkeydown = 
                        this.handleSelectableElementKeyDown.bind(this);
                    
                    this.selectableElements[i].onkeyup = 
                        this.handleSelectableElementKeyUp.bind(this);
                }
                
            }else {
                this.selectedElementIndex = -1;
            }
            
            this.updatemenubar();
        },
        
        _checkfocus: function() {
            if(this.selectableElements.length > 0) {
                var currentEl = this.selectableElements[this.selectedElementIndex];
                if(currentEl.ownerDocument.activeElement !== currentEl) {
                    $(currentEl).focus();
                }
            }
        },
        
        /**
         * Get the selected index from selectable elements
         * 
         * @returns {Number} index of currently selected component, or -1 if there are none currently
         */
        getselectedindex: function() {
            return this.selectedElementIndex;
        },
        
        getselectableelements: function() {
            return this.selectableElements;
        },
        
        getselectedelement: function() {
            return this.selectedElementIndex !== -1 ?
                this.selectableElements[this.selectedElementIndex ] : null;
        },
        
        updatemenubar: function() {
            var middleMenuText = this.options.menubutton_labels.middle;
            
            if(this.selectedElementIndex !== -1) {
                var selectedEl = this.selectableElements[
                    this.selectedElementIndex];
                $(selectedEl).focus();
                
                middleMenuText = selectedEl.hasAttribute(
                    "data-umjs-microemu-msk-label") ? 
                    selectedEl.getAttribute("data-umjs-microemu-msk-label") :
                    this.options.menubutton_labels.select;
            }
            this.element.find(".umjs-microemu-menu-middle").text(middleMenuText);
        },
        
        loadmicroemuskin: function(url, options, successFn, failFn) {
            this.options.assetBaseURL = UstadJS.resolveURL(document.location.href,
                url);
            this._setupCallbackSuccessFn = successFn;
            this._setupCallbackFailFn = failFn;
            
            $.ajax(url, {
                dataType: "text"
            }).done((function(data, textStatus, jqXHR) {
                this.setupmicroemuskin(data, options);
            }).bind(this)).fail(failFn);
        },
        
        _clipContextForButton: function(ctx, button) {
            var coords = [];
            if(button.shape instanceof $UstadJSMicroEmuButton.Polygon) {
                coords = button.shape.coords;
            }else if(button.shape instanceof $UstadJSMicroEmuButton.Rectangle) {
                var rect = button.shape;                    

                coords = [
                    {x : rect.x, y: rect.y },//top left
                    {x : rect.x + rect.width, y: rect.y},//top right
                    {x : rect.x + rect.width, y: rect.y + rect.height},//bottom right
                    {x : rect.x, y : rect.y + rect.height}//bottom left
                ];
            }

            ctx.beginPath();
            ctx.moveTo(coords[0].x, 
                coords[0].y);
            for(var i = 1; i < coords.length; i++) {
                ctx.lineTo(coords[i].x, coords[i].y);
            }
            ctx.closePath();
            ctx.clip();
        },
        
        paintCanvas: function() {
            var ctx = this.canvas.getContext("2d");
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            
            ctx.drawImage(this.options.imgs.normal, 0, 0);
            
            //paint the over image
            if(this._mouseOverButtonIndex !== -1) {
                var overButton = this._buttons[this._mouseOverButtonIndex];
                this._clipContextForButton(ctx, overButton);
                ctx.drawImage(this.options.imgs.over, 0, 0);
            }
            
            //paint pressed keys
            for(var i = 0; i < this._buttons.length; i++) {
                if(this._buttons[i].state === "pressed") {
                    this._clipContextForButton(ctx, this._buttons[i]);
                    ctx.drawImage(this.options.imgs.pressed, 0, 0);
                }
            }
            
            ctx.restore();
        },
        
        getcanvas: function() {
            return this.canvas;
        },
        
        paintablearea: function() {
            return this.paintableElement;
        }
        
        
        
    });
}(jQuery));


