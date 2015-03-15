/* 
 * A widget for displaying content in a feature phone like skin using the 
 * MicroEmu format as per:
 
  http://www.petitpub.com/labs/j2me/me/tutorial/
  and
  http://pyx4me.com/snapshot/microemu/skin.html
 */



var $UstadJSMicroEmu = {
    IMG_STATES : ["normal", "over", "pressed"],
    
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
        var attrs = ["x", "y", "width", "height"];
        var coords = {};
        for(var j = 0; j < attrs.length; j++) {
            coords[attrs[j]] = 
                parseInt(rectEl.getElementsByTagName(attrs[j])[0].textContent);
        }
        buttonObj.shape = new $UstadJSMicroEmuButton.Rectangle(coords);
    }

    return buttonObj;
};

$UstadJSMicroEmuButton.Rectangle = function(coords) {
    this.x = coords.x;
    this.y = coords.y;
    this.width = coords.width;
    this.height = coords.height;
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
        
        repaintInterval : null,
        
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
            
            /** Element that shows the virtual phone screen */
            paintableElement: null,
            
            /** Elements that can be selected are looked for in here */
            selectableContainer: null 
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
        
        /**
         * 
         * @param {string|Document} skin
         * @param {Object} options
         * @returns {undefined}
         */
        setupmicroemuskin: function(skin, options) {
            skin = UstadJS.ensureXML(skin);
            
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
            
            var evt = jQuery.Event( "loaded", { microemu: this} );
            $(this.element).trigger("loaded", evt);
            
            /*this.repaintInterval = setInterval(this.paintCanvas.bind(this),
                150);*/
            
            UstadJS.runCallback(this._setupCallbackSuccessFn, this, []);
            
            this._setupCallbackSuccessFn = null;
            this._setupCallbackFailFn = null;
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
        
        handleMouseMove: function(evt) {
            evt.preventDefault();
            this._mouseOverButtonIndex = this.getbuttonforposition(evt.offsetX,
                evt.offsetY, this._buttons);
            for(var i = 0; i < this._buttons.length; i++) {
                if(i === this._mouseOverButtonIndex) {
                    this._buttons[i].state = "over";
                }else {
                    this._buttons[i].state = "normal";
                }
            }
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        handleMouseDown: function(evt) {
            evt.preventDefault();
            var newPress = this.getbuttonforposition(evt.offsetX,
                evt.offsetY, this._buttons);
            if(newPress !== -1) {
                if(this._mousePressedKeyIndex !== -1 && this._mousePressedKeyIndex !== newPress) {
                    this._buttons[this._mousePressedKeyIndex].state = "normal";
                }
                
                this._buttons[newPress].state = "pressed";
                this._mousePressedKeyIndex = newPress;
            }
            
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
        },
        
        handleMouseUp: function(evt) {
            evt.preventDefault();
            if(this._mousePressedKeyIndex !== -1) {
                this._buttons[this._mousePressedKeyIndex].state = "normal";
                this._mousePressedKeyIndex = -1;
            }
            
            $UstadJSMicroEmu.updateCanvas(this.paintCanvas.bind(this));
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
        }
        
        
        
    });
}(jQuery));


