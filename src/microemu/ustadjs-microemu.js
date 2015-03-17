/* 
 * A jQuery widget for displaying content in a feature phone like skin with
 * some required utilities.
 * 
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

/**
 * 
 * @class $UstadJSMicroEmuButton
 * @param {string} name button name e.g. SELECT SOFT1 as per device.xml
 */
var $UstadJSMicroEmuButton = function(name) {
    this.shape = null;
    this.name = name;
    
    this.state = 0;
};

/**
 * See if a given point (relative to the main widget) is contained within
 * the button
 * 
 * @param {Number} x click x coordinate
 * @param {Number} y click y coordinate
 * @returns {boolean}
 */
$UstadJSMicroEmuButton.prototype.containsPoint = function(x, y) {
    return this.shape.containsPoint(x,y);
};

/**
 * Add a button from the relevant XML node from device.xml
 * 
 * @param {Element} xmlEl The element from device.xml that represents the button
 * @returns {$UstadJSMicroEmuButton} a button from the XML element
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

/**
 * Represents a rectangle from device.xml - e.g. paintable area or button etc.
 * 
 * @class $UstadJSMicroEmuButton.Rectangle
 * 
 * @param {Object} coords Coordinates to use
 * @param {number} coords.x rectangle x coord
 * @param {number} coords.y rectangle y coord
 * @param {number} coords.width rectangle width
 * @param {number} coords.height rectnagle height
 * 
 * @returns {$UstadJSMicroEmuButton.Rectangle}
 */
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
 * @param {Element} xmlEl XML element containing x, y, width and height elements
 * @returns {$UstadJSMicroEmuButton.Rectangle}
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

/**
 * See if an x/y coordinate is within the rectangle
 * 
 * @param {Number} x coord x
 * @param {Number} y coord y
 * @returns {Boolean} true if point is within rectangle, false otherwise
 */
$UstadJSMicroEmuButton.Rectangle.prototype.containsPoint = function(x, y) {
    return (x >= this.x && x <= (this.x + this.width)) &&
        (y >= this.y && y <= (this.y + this.height));
};

/**
 * Represents a polygon object (e.g. used on buttons)
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
     *  The widget will trigger events of type "phonebuttonpress" which will 
     *  have a buttonName property corresponding with the button name defined
     *  in device.xml.
     *  
     *  If the event is the default action (e.g. there are no selectable elements
     *  in selectablecontainer) the event will have the property 
     *  isFormDefaultAction set as true, false otherwise.
     *  
     *
     * @class UstadJSOPDSBrowser
     * @memberOf jQuery.fn
     */
    $.widget("umjs.microemu", {
        
        /**
         * Whether or not load event has fired
         * @type {Boolean}
         */
        loadedEvtFired: false,
        
        /**
         * Callback function for success on loadmicroemuskin
         * @type {function}
         */
        _setupCallbackSuccessFn: null,
        
        /**
         * Callback function for failure on loadmicroemuskin
         * @type {function}
         */
        _setupCallbackFailFn : null,
        
        /**
         * Buttons from the device.xml skin
         * @type {Array<$UstadJSMicroEmuButton>}
         */
        _buttons: [],
        
        /**
         * Index of the button that mouse is currently over (hover)
         * 
         * @type {Number}
         */
        _mouseOverButtonIndex: -1,
        
        /**
         * Index of the button that mouse is currently pressing (mousedown)
         * 
         * @type {Number}
         */
        _mousePressedKeyIndex: -1,
        
        /**
         * The index of the element in selectableElementContainer that has 
         * focus
         * @type {number}
         */
        focusedElementIndex: -1,
        
        /**
         *  The selectable elements found in selectableElementContainer 
         *  @type Array{Element}
         */
        selectableElements: [],
        
        options : {
            /**
             *  The XML Document with the MicroEmu skin descriptor 
             *  @type {Document}
             */
            microEMUSkinXML: null,
            
            /** 
             * The absolute URL based from which assets are loaded 
             * @type {String}
             */ 
            assetBaseURL: "",
            
            /**
             * Object with .normal .over and .pressed of the image sources for
             * phone skin
             * @type {Object}
             */
            imgSrcs: {},
            
            /**
             * Object with .normal .over and .pressed of the image objects for
             * phone skin
             * @type {Object}
             */
            imgs: {},
            
            /**
             * Object with .normal .over and .pressed of the image load states for
             * phone skins as integers -1 = error, 0 = loading, 1 = loaded
             * @type {Object}
             */
            imgsLoadState: {},
            
            /** 
             * Main HTML5 Canvas to draw on
             * @type {Canvas}
             */
            canvas : null,
            
            /**
             * Width of the widget - set automatically from the skin on load
             * @type {Number}
             */
            width: 0,
            
            /**
             * Height of the widget - set automatically from the skin on load
             * @type {Number}
             */
            height: 0,
            
            /**
             * The scale to apply to buttons and images
             * 
             * @type {Number}
             */
            scale: 1.0,
            
            /**
             * An element that contains the screen area (containing the paintable
             * area and menubar area)
             * 
             * @type {Element}
             */
            screenAreaElement: null,
            
            /**
             * An element used to put the menubar in - positioned underneath
             * the paintableElement as per device.xml
             * 
             * @type {Element}
             */
            menubarAreaElement: null,
            
            /** 
             * The main paintable area on the screen where content is displayed
             * 
             * @type {Element}
             */
            paintableElement: null,
            
            /** 
             * Elements that can be selected using the up and down buttons on
             * the phone are looked for in here.
             * 
             * e.g. paintableElement is an automatically generated div, and then 
             * we might use an iframe or other neseted containers.  Within this 
             * container the widget will use
             * selectableElementSelector to focus input items etc. when the user
             * pushes the up/down buttons.
             * 
             * To implement a custom text for the middle select key use an
             * data-umjs-microemu-msk-label attribute on the item
             * 
             * @type {Element}
             */
            selectableContainer: null ,
            
            /**
             * The jQuery selector that is used to find user selectable elements
             * in selectableContainer
             */
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
        
        /**
         * Get button according to the name from device.xml e.g. "SELECT"
         * @param {String} buttonName name of button to find
         * @returns {$UstadJSMicroEmuButton}
         */
        getbuttonbyname: function(buttonName) {
            for(var i = 0; i < this._buttons.length; i++) {
                if(this._buttons[i].name === buttonName) {
                    return this._buttons[i];
                }
            }
            
            return null;
        },
        
        /**
         * Get button by index in the button array
         * 
         * @param {Number} index
         * @returns {$UstadJSMicroEmuButton}
         */
        getbuttonbyindex: function(index) {
            return this._buttons[index];
        },
        
        /**
         * Get the index of a button within the button array
         * @param {$UstadJSMicroEmuButton} button
         * @returns {Number} index in buttons array or -1 if it's not in
         */
        getindexofbutton: function(button) {
            for(var i = 0; i < this._buttons.length; i++) {
                if(this._buttons[i].name === button.name) {
                    return i;
                }
            }
        },
        
        /**
         * Setup the widget from a given skin.  Make sure the path is set so
         * imgSrcs can be resolved
         * 
         * @param {string|Document} skin the xml of 
         * @param {Object} options misc options (currently unused)
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
        
        /**
         * Multiply by the scale and round off the number provided
         * 
         * @param {Number} num
         * @returns {Number} num * scale rounded to nearest integer
         */
        _scaleNum: function(num) {
            return Math.round(num * this.options.scale);
        },
        
        /**
         * 
         * Run once all images have loaded - now we know the resolution and can
         * set everything in motion
         * 
         */
        _handleAllImagesLoaded: function() {
            if(this.loadedEvtFired) {
                return;
            }
            this.loadedEvtFired = true;
            
            this.options.width = this._scaleNum(this.options.imgs.normal.width);
            this.options.height = this._scaleNum(this.options.imgs.normal.height);
            
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
                this._scaleNum(displayRect.x + paintableRect.x) + "px";
            this.paintableElement.style.marginTop =
                this._scaleNum(displayRect.y + paintableRect.y) + "px";
            this.paintableElement.style.width = this._scaleNum(
                paintableRect.width) + "px";
            this.paintableElement.style.height = this._scaleNum(
                    paintableRect.height) + "px";
            
            //this.paintableElement.style.border = "1px solid black";
            
            this.paintableElement.style.zIndex = 10000;
            this.paintableElement.innerHTML = "HI WORLD";
            
            //now make the menubar element
            this.menubarElement = document.createElement("div");
            this.menubarElement.style.position = "absolute";
            this.menubarElement.style.marginLeft = 
                this._scaleNum(displayRect.x + paintableRect.x) + "px";
            this.menubarElement.style.marginTop =
                this._scaleNum(displayRect.y + paintableRect.y + paintableRect.height) + "px";
            this.menubarElement.style.width = 
                this._scaleNum(paintableRect.width) + "px";
            this.menubarElement.style.height = 
                this._scaleNum(displayRect.height - 
                (paintableRect.height + paintableRect.y)) + "px";
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
        
        /**
         *  Handle mousedown on menubar area
         *  
         * @param {MouseEvent} evt
         */
        handleMenuBarMouseDown: function(evt) {
            evt.preventDefault();
            var evtObj = $.Event("phonebuttonpress", {
                "target" : this.element
            });
            var buttonName = evt.target.getAttribute("data-umjs-microemu-key");
            var buttonObj = this.getbuttonbyname(buttonName);
            var buttonIndex = this.getindexofbutton(buttonObj);
            
            this._setMousePressedButtonIndex(buttonIndex);
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        /**
         *  Handle mouseup on menubar area
         *  
         * @param {MouseEvent} evt
         */
        handleMenuBarMouseUp: function(evt) {
            evt.preventDefault();
            var buttonName = evt.target.getAttribute("data-umjs-microemu-key");
            this._setMousePressedButtonIndex(-1);

            
            var evtObj = $.Event("phonebuttonpress", {
                "target" : this.element
            });
            
            evtObj.buttonName = buttonName;
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
            this.handlePhoneButtonPress(evtObj);
        },
        
        /**
         * Look through an array of buttons to find the one which is at this
         * x/y position.
         * 
         * @param {number} x the x coord
         * @param {number} y the y coord
         * @param {Array<$UstadJSMicroEmuButton>} [buttonArr] of buttons to look in, this._buttons by default
         * @returns {number} the index of the button in the array, -1 if it's not there
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
        
        /**
         * Used to get the position of a mouseevent relative to it's target 
         * element
         * 
         * @param {MouseEvent} evt
         * @returns {Object} object wtih x and y coords relative to evt.target
         */
        getOffsetPosForEvt: function(evt) {
            var offsetVal =  {
                x: evt.pageX - $(evt.target).offset().left,
                y : evt.pageY - $(evt.target).offset().top
            };
            offsetVal.x = Math.round(offsetVal.x / this.options.scale);
            offsetVal.y = Math.round(offsetVal.y / this.options.scale);
            
            return offsetVal;
        },
        
        /**
         * Handle user mouse move and so we can show the appropriate over clip
         * 
         * @param {type} evt
         * @returns {undefined}
         */
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
        
        /**
         * Handle when the mouse goes down (show pressed button)
         * 
         * @param {MouseEvent} evt
         */
        handleMouseDown: function(evt) {
            evt.preventDefault();
            var mousePos = this.getOffsetPosForEvt(evt);
            var newPress = this.getbuttonforposition(mousePos.x,
                mousePos.y, this._buttons);
            
            this._setMousePressedButtonIndex(newPress);
            
            
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        /**
         * Set the button that is being pushed by the mouse (can come from
         * clicking on canvas directly or clicking on the menubar
         * 
         * @param {Number} newIndex the new index that is being clicked on
         * 
         */
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
        
        /**
         * Handle mouse up event - unpress button if one is pressed
         * 
         * @param {MouseEvent} evt
         */
        handleMouseUp: function(evt) {
            evt.preventDefault();
            if(this._mousePressedKeyIndex !== -1) {
                this._buttons[this._mousePressedKeyIndex].state = "normal";
                this._mousePressedKeyIndex = -1;
            }
            
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        /**
         * Handle mouse click on  the canvas - fire event for button push
         * 
         * @param {MouseEvent} evt
         */
        handleMouseClick: function(evt) {
            evt.preventDefault();
            var mousePos = this.getOffsetPosForEvt(evt);
            var pressedButtonIndex = this.getbuttonforposition(mousePos.x,
                mousePos.y);
            var pressedButton = this._buttons[pressedButtonIndex];
            if(pressedButton) {
                var evtObj = $.Event("phonebuttonpress", {
                    "target" : this.element
                });
                evtObj.buttonName = pressedButton.name;
                this.handlePhoneButtonPress(evtObj);
            }
            
            this._checkfocus();
        },
        
        /**
         * Handle when one of the skin images has loaded  - if all have
         * loaded trigger _handleAllImagesLoaded
         * 
         * @param {ProgressEvent} evt
         * @returns {undefined}
         */
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
            evt.isFormDefaultAction = (this.selectedElementIndex === -1);
            
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
            
            $(this.element).trigger(evt);
        },
        
        /**
         * Handle key down on selectable items - show pressed key for
         * relevant button
         * 
         * Attached to the selectable items themselves - prevents losing focus
         * 
         * @param {KeyEvent} evt
         */
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
        
        /**
         * Handle when key is up on a selectableElement - move to the next button
         * and fire an event if this is a recognized button
         * 
         * @param {KeyEvent} evt
         */
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
        
        /**
         * Sets the selectable container from which elements will be looked
         * for.
         * 
         * @param {Element} selectableContainer
         */
        setselectablecontainer: function(selectableContainer) {
            this.selectableContainer = selectableContainer;
            this.updateselectable();
        },
        
        /**
         * When the contents of the selectable container change - run this.
         * 
         * Looks for selectable elements within the selectable container
         * and updates the menubar
         * 
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
        
        /**
         * Make sure that the last selected item still has focus - useful if
         * the user clicks outside etc.
         * 
         */
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
        
        /**
         * Gets the selectable elements array found on the current selectable container
         * 
         * @returns {Array<Element>}
         */
        getselectableelements: function() {
            return this.selectableElements;
        },
        
        /**
         * Gets the currently selected element within the selectable container
         * if there is one
         * 
         * @return {Number} index of hte selected item or -1 if there are none to select from
         */
        getselectedelement: function() {
            return this.selectedElementIndex !== -1 ?
                this.selectableElements[this.selectedElementIndex ] : null;
        },
        
        /**
         * Update the menu bar - in particular the middle select key for the
         * currently selected item
         * 
         */
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
        
        /**
         * Load a MicroEMU device.xml skin from the given URL
         * 
         * @param {String} url the URL to load from 
         * @param {Object} options misc options space - currently not used
         * @param {function} successFn function to run once successfully setup
         * @param {function} failFn function to run if fails - e.g. image not found
         */
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
        
        /**
         * Clip the canvas context according to a given button
         * 
         * @param {2DContext} ctx
         * @param {$UstadJSMicroEMUButton} button
         */
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

            var scaledCoords = [];
            for(var i = 0; i < coords.length; i++) {
                scaledCoords.push({
                    x : this._scaleNum(coords[i].x),
                    y : this._scaleNum(coords[i].y)
                });
            }
            
            ctx.beginPath();
            ctx.moveTo(scaledCoords[0].x, 
                scaledCoords[0].y);
            for(var i = 1; i < scaledCoords.length; i++) {
                ctx.lineTo(scaledCoords[i].x, scaledCoords[i].y);
            }
            ctx.closePath();
            ctx.clip();
        },
        
        /**
         * Paint the skin of the phone on the canvas and show pressed and over
         * keys
         * 
         */
        paintCanvas: function() {
            var ctx = this.canvas.getContext("2d");
            ctx.save();
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            
            ctx.drawImage(this.options.imgs.normal, 0, 0, this.options.width,
                this.options.height);
            
            //paint the over image
            if(this._mouseOverButtonIndex !== -1) {
                var overButton = this._buttons[this._mouseOverButtonIndex];
                this._clipContextForButton(ctx, overButton);
                ctx.drawImage(this.options.imgs.over, 0, 0, this.options.width,
                    this.options.height);
            }
            
            //paint pressed keys
            for(var i = 0; i < this._buttons.length; i++) {
                if(this._buttons[i].state === "pressed") {
                    this._clipContextForButton(ctx, this._buttons[i]);
                    ctx.drawImage(this.options.imgs.pressed, 0, 0, 
                        this.options.width,this.options.height);
                }
            }
            
            ctx.restore();
        },
        
        /**
         * Get the canvas being used to show the phone skin
         * 
         * @returns {Canvas}
         */
        getcanvas: function() {
            return this.canvas;
        },
        
        /**
         * Get the paintable area div in which items can be placed
         * 
         * @returns {Element}
         */
        paintablearea: function() {
            return this.paintableElement;
        }
        
        
        
    });
}(jQuery));


