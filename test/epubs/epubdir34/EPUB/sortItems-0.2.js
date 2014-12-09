
//if this variable is set then we will not check the text value to automatically mark something correct
// for sorting e.g. B-O-B
var sortActivityExcludeAutoText = new Array();

var sortAcitvitySelectedArr = new Array();

var activeBg = "red";


var colorCache = "";


function moveSortableItem(sortId, increment) {
    //first find the array / order of it now
    var orderAsIs = $("#sortme" + sortId).sortable("toArray");
    var selectedItem = sortAcitvitySelectedArr[sortId];
    var currentIndex = orderAsIs.indexOf(selectedItem);
    
    var nextItem = orderAsIs[currentIndex + increment];
    if(increment == 1) {
        $("#" + selectedItem).insertAfter("#" + nextItem);    
    }else {
        $("#" + selectedItem).insertBefore("#" + nextItem);
    }
}

/**
 * Gets an array of the ids that contain the items to be sorted
 * 
 * @param sortId String Idevice ID 
 * @return Array Array of node ids that should be sorted by the user
 */
function sortItemsGetOriginalArray(sortId) {
    var sortItemsArr = [];
    var sortItemSelector = "#sortmeitemcontainer" + sortId
	     + " .sortMeItem";
    var numItems = $(sortItemSelector).length;
    $(sortItemSelector).each(function() {
        sortItemsArr.push($(this).attr("id"));
    });
    
    return sortItemsArr;    
}

/** 
 * Get the effect name to use for feedback to show
 *
 * @param sortId String Idevice ID
 * @param feedbackType String correct or wrong
 * @return String effect name to use
 */
function sortItemGetEffectName(sortId, feedbackType) {
    return $("#sortmeitemcontainer"+sortId).attr("data-fbeffect-"
        + feedbackType);
}

function initSortActivity(sortId) {
	var sortItemsListOriginal = sortItemsGetOriginalArray(sortId);
	if($("#sortme"+sortId).attr("data-sort-init") === "done") {
	    return;//already done - do not rerun
	}
    	
	var sortItemsList = new Array();
	for (var i = 0; i < sortItemsListOriginal.length; i++) {
		sortItemsList[i] = sortItemsListOriginal[i];
	}
	sortItemsList.sort(function() { return 0.5 - Math.random()});
	var sortHolderId = "#sortme" + sortId;
	var itemStyle = $("#sortmeitemcontainer" + sortId).attr("data-sortable-item-style");
	$(function() {
		for(var i = 0; i < sortItemsList.length; i++) {	
			var thisItemHTML = $("#" + sortItemsList[i]).html();
			var thisItemId = "li" + sortItemsList[i];

			$(sortHolderId).append("<li class='sortablesub' " 
					+ " id='li" + sortItemsList[i] + "' style='z-index: 5; " 
					+ " list-style-image: none; list-style-type: none; "
				+ itemStyle + "'>" + thisItemHTML + "</li>");
		}

		$(sortHolderId).sortable();	
		
		var buttonContainer = "";
		
	//$(sortHolderId).disableSelection();
		$("#sortmecorrectoverlay" + sortId).hide();
		$("#sortmewrongoverlay" + sortId).hide();
		$(sortHolderId).unbind("click");
	});
	
	$("#sortme"+sortId).attr("data-sort-init", "done")
}


/**
Check the order of the items in the list
*/
function checkOrder(sortId) {
	var orderAsIs = $("#sortme" + sortId).sortable("toArray");
	var correctOrder = sortItemsGetOriginalArray(sortId);				
	var orderCorrect = true;
	for (var i = 0 ; i < orderAsIs.length; i++) {
		var currentItemId = orderAsIs[i];
		var compareToCorrectId = "li" + correctOrder[i];
		if(currentItemId != compareToCorrectId) {
		        //check and see the value of this
		        if(sortId in sortActivityExcludeAutoText &&  sortActivityExcludeAutoText[sortId] == true) {
		                orderCorrect = false;
		        }else {
		                var val1 = $("#" + currentItemId).text();
		                var val2 = $("#" + compareToCorrectId).text();
		                if(val1 != val2) {
                			orderCorrect = false;
			        }
			}
		}
	}
	if(orderCorrect) {
		$("#sortmecorrectoverlay" + sortId).show(sortItemGetEffectName(
		    sortId, "correct"));
		$("#sortme" + sortId).sortable("disable");
	}else {
		$("#sortmewrongoverlay" + sortId).show(sortItemGetEffectName(
		    sortId, "wrong"));
		setTimeout("$('#sortmewrongoverlay" + sortId + "').fadeOut();", 10000);
	}
}

function initSortExercises(activeContainerSelector) {
    var activeContainerSelector = checkActivePageContainer(
    		activeContainerSelector);
	$(activeContainerSelector + " .sortmeitemcontainer").each(function() {
	    var deviceId = $(this).attr("data-idevice-id");
	    initSortActivity(deviceId);
	});	
}

/*
Init - lets get going
*/
$(function() {
    $(document).on("execontentpageshow", function(evt) {
                        initSortExercises(evt.targetSelector);
                    });
    initSortExercises();
});


