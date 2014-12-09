


var EXEDragNDrop = null;

var EXEDragNDropInstance = {};

var EXEDND_PREFIX_DNDELEMENT="exedndelement_";

/*
 * Strip the prefix off, tokenize
 */
function dndStripPrefixGetId(prefixStr, idStr) {
	idStr = idStr.substring(prefixStr.length);
	var resultArr = idStr.split("_");
	return resultArr;
}

/**
Represents an EXE Drag and Drop Idevice instance on the page

@class EXEDragNDrop
@constructor
*/
EXEDragNDrop = function(ideviceid) {
    this.ideviceid = ideviceid;
    
    //array of potential drop targets 
    this.targets = [];
    
    //the interval for feedback...
    this.feedbackTimeoutId = null;
};

EXEDragNDrop.prototype = {
		
	autoResize : function() {
		var origDimensions = $("#exednd_container_" + 
				this.ideviceid).attr("data-exednd-origdimension");
		var origDimensionsArr = origDimensions.split(",");
		for(var i = 0; i < origDimensionsArr.length; i++) {
			origDimensions[i] = parseInt(origDimensions[i]);
		}
		
		var parentWidth = 
			  $("#id" + this.ideviceid +" DIV.iDevice_content_wrapper").width();
		var ratio = parentWidth / origDimensionsArr[0];
		
		var newWidth = parentWidth;
		var newHeight = Math.round(origDimensionsArr[1] * ratio);
		
		$("#exednd_master_container_" + this.ideviceid).width(
				newWidth).height(newHeight);
		$("#exednd_container_" + this.ideviceid).width(
				newWidth).height(newHeight);
		$("#exednd_mainimg_" + this.ideviceid).width(
				newWidth).height(newHeight);
		var elSelector = this.getDNDAreaSelector();
		$(elSelector).each(function() {
			var coordsAttr = $(this).attr("data-exednd-pos");
			var dimAttr = $(this).attr("data-exednd-origdimensions");
			var propnames = ["left", "top", "width", "height"];
			
            var coordsParts = coordsAttr.split(",");
            var dimParts = dimAttr.split(",");
            
            //put together in one array
            coordsParts[2] = dimParts[0]
            coordsParts[3] = dimParts[1];
            
            for(var i = 0; i < coordsParts.length; i++) {
            	coordsParts[i] = Math.round(parseInt(
            			coordsParts[i])*ratio);
            	$(this).css(propnames[i], "" + coordsParts[i] + "px");
            }
            $(this).children().css("transformOrigin", "0 0");
        	$(this).children().css("transform", 
    	        "scale(" + ratio+", "+ ratio+")");
		});
	},
	
	getDNDAreaSelector : function() {
		var elSelector = "#exednd_container_" + this.ideviceid + 
			" .exednd_element";
		return elSelector;
	},
		
	initInteraction : function() {
		var elSelector = this.getDNDAreaSelector();
		
		var dropTargetArr = [];
		
		$(elSelector).each(function(){
			var coordsAttr = $(this).attr("data-exednd-pos");
            var coordsParts = coordsAttr.split(",");
            
            $(this).css("left", "" + coordsParts[0] + "px");
            $(this).css("top", "" + coordsParts[1] + "px");
            var dragMode = $(this).attr("data-exednd-dragmode");
            var srcElement = this;
            
            var revertFunction = function(valid) {
            	var myElement = srcElement;
    			var draggedEl = $(myElement);///event.target
    			if(!draggedEl.hasClass("exednd_element")) {
    				draggedEl = $(event.target).closest(".exednd_element");
    			}
    			var revertMode = draggedEl.attr(
    					"data-exednd-revert");
    			
    			if(!valid && revertMode != "norevert") {
    				//now is time to show negative feedback
    				var feedbackElId = draggedEl.attr(
						"data-exednd-fbwrong");
					var dndIds = dndStripPrefixGetId("exedndelement_", 
							draggedEl.attr("id"));
					if(dndIds) {
						EXEDragNDropInstance[dndIds[0]].showFeedbackEl(feedbackElId);
					}
    			}

    			//if false is returned - will stay in place
    			//if true is returned will revert
    			if(revertMode == "norevert") {
    				return false;
    			}else {
    				return !valid;
    			}
    		};
            
            if(dragMode == "candrag") {
            	$(this).css("cursor", "move");
            	$(this).draggable({
            		revert: revertFunction 
            	});
            	
            	//check and see if there is a drop target for this
            	var targetName = $(this).attr("data-exednd-target");
            	if(dropTargetArr.indexOf(targetName) == -1 && (targetName != "none" && targetName != "none2")) {
            		dropTargetArr.push(targetName);
            	}
            }
            
		});
		
		//now go through and assign the drop targets
		for(var i = 0; i < dropTargetArr.length; i++) {
		    var theSelector = "#exedndelement_" + dropTargetArr[i];
			$(theSelector).droppable({
     			accept: ".exetarget_" + dropTargetArr[i],
				drop: function(event, ui) {
					var droppedEl = ui.draggable;
					var feedbackElId = $(droppedEl).attr(
							"data-exednd-fbcorrect");
					var dndIds = dndStripPrefixGetId("exedndelement_", 
							$(droppedEl).attr("id"));
					if(dndIds) {
						EXEDragNDropInstance[dndIds[0]].showFeedbackEl(feedbackElId);
					}
				}
			});
		}
		
		this.autoResize();
	},
	
	getEditImgFieldId : function() {
		var imgFieldId = $("#exednd_edit_container_" 
				+ this.ideviceid).attr("data-exednd-imgfieldid");
		return imgFieldId;
	},
	
	addPicEventHandlers : function() {
		var imgFieldId = this.getEditImgFieldId();
		var thisEl = this;
		var picEvtHandleFunction = function(evt) {
			thisEl.updateEditorSizeFromPic(evt);
		};
		
		$("#width" + imgFieldId).on("change", picEvtHandleFunction);
		$("#height" + imgFieldId).on("change", picEvtHandleFunction);
		$("#img" + imgFieldId).on("load", picEvtHandleFunction);
	},
    
	updateEditorSizeFromPic: function(evt) {
		var imgFieldId = this.getEditImgFieldId();
		var newWidth = $("#width" + imgFieldId).val();
		var newHeight = $("#height" + imgFieldId).val();
		
		$("#exednd_edit_mastercontainer_" + this.ideviceid).width(
				newWidth).height(newHeight);
		$("#exednd_edit_container_" + this.ideviceid).width(
				newWidth).height(newHeight);
		$("#exednd_mainimg_" + this.ideviceid).width(
				newWidth).height(newHeight);
	},
	
    /**
    Populate the editor div which allows authoring mode users to setup 
    @method initEditor
    */
    initEditor : function() {
    	var elSelector = "#exednd_container_" + this.ideviceid + 
    		" .exednd_element";
    	//check for failure due to newly set image
		var setHeight = parseInt($("#exednd_container_"
				+ this.ideviceid).css("height"));
    	
    	var i = 0;
    	var thisIdeviceId = this.ideviceid;
    	var thisEl = this;
        $(elSelector).each(function(i) {
            var copyEl = $(this).clone();
            var origElId = $(this).attr("id");
            var idS = dndStripPrefixGetId(EXEDND_PREFIX_DNDELEMENT, 
            		origElId);
            var newElId = "exednd_element_edit_" + idS[0] + "_" + idS[1];
            thisEl.targets[thisEl.targets.length] = idS[0] + "_" + idS[1];
            copyEl.attr("id", newElId);
            var elIdNum = i + 1;
            
            
            //delete link stuff
            
            var elementId = idS[0] + "_" + idS[1];
            var objId = idS[0];
            var deleteLink = ' <a style="display: inline-block; float: right; background-color: black; color: white; padding: 3px;" href="#" onclick="submitLink(\'' 
            	+ elementId + "', '" + objId + '\',1)">x</a>';
            
            
            copyEl.html(deleteLink + "Area " + elIdNum);
            
            copyEl.appendTo("#exednd_edit_container_" + idS[0]);
            var coordsAttr = $(this).attr("data-exednd-pos");
            var coordsParts = coordsAttr.split(",");
            
            $(copyEl).css("left", "" + coordsParts[0] + "px");
            $(copyEl).css("top", "" + coordsParts[1] + "px");
            
            
            copyEl.css("margin-top")
            copyEl.draggable({ 
            	containment: "parent",
            	stop: function(evt, ui) {
            		var updateFieldId = $(this).attr("data-exednd-updatefield");
            		EXEDragNDropInstance[thisIdeviceId].updateLocation(
        				idS[0] + "_" + idS[1], this, updateFieldId);
            	}
    		});
            copyEl.resizable();
            
            //make it semi transparent with a border
            $(copyEl).css("background", "rgba(255,255,255,0.5)");
            $(copyEl).css("border", "1px solid red");
        });
        
        
        var targetEls = "";
        var targetElsArr = [];
        for(var i = 0; i < this.targets.length; i++) {
        	var targetNum = i + 1;
        	targetEls += "<option value='" + this.targets[i]+"'>" 
        		+ "Area " + targetNum + "</option>";
        	targetElsArr[i] = [this.targets[i], targetNum];
        }
        
        var exeTargetEls = $(".exetarget"); 
        exeTargetEls.each(function() {
        	var thisIndex = exeTargetEls.index(this);
        	for(var j = 0; j < targetElsArr.length; j++) {
        		if(j != thisIndex) {
        			$(this).append("<option value='" + targetElsArr[j][0]+"'>" 
        	        		+ "Area " + targetElsArr[j][1] + "</option>");
        		}
        	}
        	//alert(thisIndex);
        	//$(this).append(targetEls);
        	var selectedVal = $(this).attr("data-currentval");
        	$(this).val(selectedVal);
        });
        
        this.addPicEventHandlers();
        
        $(".content_type_choiceholder SELECT").on("change", function(evt){
        	thisEl.updateAreaContentTypeFromSelect(evt.target);
        });
        
        $(".content_type_choiceholder SELECT").each(function() {
        	thisEl.updateAreaContentTypeFromSelect(this);
        });
        
        
        $(".exednd_area_feedback_typeholder SELECT").on("change", function(evt) {
        	thisEl.updateFeedbackForArea(evt.target);
        });
        
        $(".exednd_area_feedback_typeholder SELECT").each(function() {
        	thisEl.updateFeedbackForArea(this);
        });
        
    },
    
    updateFeedbackForArea : function(selectEl) {
    	var currentVal = $(selectEl).val();
    	var thisFieldId = $(selectEl).closest(
			".exednd_area_feedback_typeholder").attr(
					"data-content-type-fieldid");
    	$(".exednd_area_feedbacktype_" + thisFieldId).hide();
    	$("#exednd_area_feedback_" + currentVal + "_" + thisFieldId).show();
    },
    
    /**
     * Hide content area types for those other than what is being used
     * 
     */
    updateAreaContentTypeFromSelect : function(selectEl) {
    	var currentVal = $(selectEl).val();
    	var thisFieldId = $(selectEl).closest(
			".content_type_choiceholder").attr(
					"data-content-type-fieldid");
    	$(".content_type_" + thisFieldId).hide();
    	$("#content_type_" + currentVal + "_" + thisFieldId).show();
    },
    
    showFeedbackEl : function(eleId) {
    	var htmlStr = $("#" + eleId).html();
    	//var relativeToEl = window;
    	var relativeToEl = $("#exednd_container_" + this.ideviceid);
    	var feedbacContEl = document.getElementById(eleId);
    	var fbShowElId ="#exednd_feedbackshow_" + this.ideviceid; 
    	
    	$("#exednd_feedbackshow_" + this.ideviceid).html(htmlStr);
    	
    	//center technique from http://jsfiddle.net/DerekL/GbDw9/
    	$(fbShowElId).css("position","absolute");
    	$(fbShowElId).css("top", Math.max(0, (($(relativeToEl).height() - $(fbShowElId).outerHeight()) / 2)));
    	$(fbShowElId).css("left", Math.max(0, (($(relativeToEl).width() - $(fbShowElId).outerWidth()) / 2)));
    	$(fbShowElId).css("visibility", "visible");
    	$(fbShowElId).show();
    	
    	this.timeoutID =  setTimeout(function() {
    		$(fbShowElId).hide();
    	}, 2000);
    	
    	//now try and play any media which is in there
    	var fbShowEl = document.getElementById("exednd_feedbackshow_" + this.ideviceid);
    	var audioElements = findAllMediaInElement(fbShowEl);
        for(var i = 0; i < audioElements.length; i++) {
            playAndReset(audioElements[i]);
        }
    },
    
    
    updateLocation: function(elID, element, updateFieldId) {
    	//var left = parseInt($(element).css("left"));
    	//var top = parseInt($(element).css("top"));
    	var parentEl = $(element).parent();
    	var left = $(element).offset().left - parentEl.offset().left;
    	var top = $(element).offset().top - parentEl.offset().top;
    	var width = $(element).width();
    	var height = $(element).height();
    	$("#" + updateFieldId).val(left + "," + top + "," 
    			+ width + "," + height);
    }

};

function initDragNDrop(containerSelector) {
	containerSelector = checkActivePageContainer(containerSelector);
    $(containerSelector + " .exednd_container").each(function() {
        var x = 0;
        var dndIdeviceId = $(this).attr("data-exedndid");
        EXEDragNDropInstance[dndIdeviceId] = new EXEDragNDrop(
        		dndIdeviceId);
        //see if this is edit mode or time to run the interaction
        if($("#exednd_edit_container_" + dndIdeviceId).length > 0) {
        	EXEDragNDropInstance[dndIdeviceId].initEditor();
        }else {
        	EXEDragNDropInstance[dndIdeviceId].initInteraction();
        }
    });
}

$(function() {
    initDragNDrop();
    $(document).on("execontentpageshow", function(evt) {
    	initDragNDrop(evt.targetSelector);
    });
    $(".exednd_editor_accordion").accordion({heightStyle: "fill"});
    $(".exednd_area_tabdiv").tabs();
    $(".exednd_area_feedbacktabs").tabs();
});