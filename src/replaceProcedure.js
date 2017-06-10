function replaceProcedure (e) {
	var index = e.srcElement.parentElement.classList.value;
	var srcTable = e.srcElement.parentElement.parentElement;
	var trList = document.getElementsByClassName(index);
	var trArray = [];
	for (var i = 0; i < trList.length; i++) {
		trArray.push(trList[i]);
	}
	var procedureName = trArray[0].children[2].innerHTML;
	var procedureNameOrig = trArray[0].children[2].innerHTML;
	// if procedure contains of more than 1 step, the combination names are combined
	// in order to be found accordingly
	if (trArray.length > 2) {
		var combinationName = '';
		for (var i = 1; i < trArray.length; i++) {
			var end = ', ';
			if (i == trArray.length - 1) {
				end = '';
			}
			combinationName += trArray[i].children[0].innerHTML + end;
		}
	} 
	else {
		var combinationName = trArray[1].children[0].innerHTML;
	}
	var groupName, amountName, workingWidthName;
	if (trArray[0].children[3].innerHTML !== '') {
		amountName = trArray[0].children[3].innerHTML.split(' ')[0];
	}

	function createOptions (item, elem) {
		var option = document.createElement('option');
		option.innerHTML = item;
		option.value = item;
		if (item == groupName || item == procedureName || item == combinationName || item == amountName.slice(0, -1)) {
			option.selected = 'selected';
		}
		elem.appendChild(option);
	}

	//-----------------------------------------------------------------
	//	C R E A T E  I N I T I A L   S T A T E
	//-----------------------------------------------------------------
	// match preselected values with replaced procedure
	Object.keys(machCombiObject).forEach(function (item) {
		if (typeof machCombiObject[item] !== 'object') {
			return;
		}
		if (procedureName in machCombiObject[item]) {
			groupName = item;
			//console.log(item + ' ' + combinationName)
			if (typeof amountName == 'undefined') {
				amountName = machCombiObject[item][procedureName][combinationName].amount[0];
			}
			workingWidthName = machCombiObject[item][procedureName][combinationName].workingWidth[0];
		}
	});
	if (typeof groupName == 'undefined') {
		loop1:
		for (var i = 0; i < Object.keys(machCombiObject).length; i++) {
			var item = Object.keys(machCombiObject)[i];
			if (typeof machCombiObject[item] !== 'object') {
				continue;
			}
			loop2:
			for (var j = 0; j < Object.keys(machCombiObject[item]).length; j++) {
				var itemProcedure = Object.keys(machCombiObject[item])[j]
				//console.log(itemProcedure)
				if (typeof machCombiObject[item][itemProcedure] !== 'object') {
					continue;
				}
				var count = 0;
				procedureNameOrig.split(' ').forEach(function (key) {
					if (itemProcedure.indexOf(key) > -1) {
						count += 1;
					}
				})
				if (combinationName in machCombiObject[item][itemProcedure] && count == procedureNameOrig.split(' ').length) {
					groupName = item;
					procedureName = itemProcedure;
					//console.log(groupName)
					if (typeof amountName == 'undefined') {
						amountName = machCombiObject[item][itemProcedure][combinationName].amount[0];
					}
					workingWidthName = machCombiObject[item][itemProcedure][combinationName].workingWidth[0];
					break loop1;					
				}
				else if (combinationName in machCombiObject[item][itemProcedure]) {
					//console.log(combinationName)
					groupName = item;
					procedureName = itemProcedure;
					//console.log(groupName)
					amountName = machCombiObject[item][itemProcedure][combinationName].amount[0];
					workingWidthName = machCombiObject[item][itemProcedure][combinationName].workingWidth[0];
					//break loop1;
				}
			}
		}
	}

	// populate dropdown menus
	var group = document.getElementById('procedure.group');
	group.innerHTML = '';
	Object.keys(machCombiObject).forEach(function (item) {
		if (item == 'id' || item == '_id' || item == '_rev') {
			return
		}
		createOptions(item, group);
	});

	var procedure = document.getElementById('procedure.procedure');
	procedure.innerHTML = '';
	Object.keys(machCombiObject[groupName]).forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, procedure);
	});

	var combination = document.getElementById('procedure.combination');
	combination.innerHTML = '';
	Object.keys(machCombiObject[groupName][procedureName]).forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, combination);
	});

	var amount = document.getElementById('procedure.amount');
	amount.innerHTML = '';
	machCombiObject[groupName][procedureName][combinationName].amount.forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, amount);
	});

	var workingWidth = document.getElementById('procedure.workingWidth');
	workingWidth.innerHTML = '';
	machCombiObject[groupName][procedureName][combinationName].workingWidth.forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, workingWidth);
	});

	// show replacement box popup window
	var box = document.getElementById('replacementBox');
	var blur = document.getElementById('blur');
	box.classList.remove('hide');
	blur.classList.remove('hide');

	//-----------------------------------------------------------------
	// E V E N T S
	//-----------------------------------------------------------------
	// handle change events
	group.onchange = function () {
		var group = document.getElementById('procedure.group').value;
		var procedure = document.getElementById('procedure.procedure');
		// delete current procedure options
		procedure.innerHTML = '';
		// populate procedures dropdown with new options
		Object.keys(machCombiObject[group]).forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, procedure);
		});
		// delete combination, amount, working width options
		document.getElementById('procedure.combination').innerHTML = '';
		document.getElementById('procedure.amount').innerHTML = '';
		document.getElementById('procedure.workingWidth').innerHTML = '';

		Object.keys(machCombiObject[group][Object.keys(machCombiObject[group])[1]]).forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, combination);
		});

		machCombiObject[group][Object.keys(machCombiObject[group])[1]][Object.keys(machCombiObject[group][Object.keys(machCombiObject[group])[1]])[1]].amount.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, amount);
		});
		machCombiObject[group][Object.keys(machCombiObject[group])[1]][Object.keys(machCombiObject[group][Object.keys(machCombiObject[group])[1]])[1]].workingWidth.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, workingWidth);
		});
	};

	procedure.onchange = function () {
		var group = document.getElementById('procedure.group').value;
		var procedure = document.getElementById('procedure.procedure').value;
		var combination = document.getElementById('procedure.combination');
		// delete current procedure options
		combination.innerHTML = '';
		// populate combinations dropdown with new options
		var combinationsArr = Object.keys(machCombiObject[group][procedure]);
		combinationsArr.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, combination);
		});
		// delete amount, working width options
		document.getElementById('procedure.amount').innerHTML = '';
		document.getElementById('procedure.workingWidth').innerHTML = '';
		//if (combinationsArr.length == 2) {
		machCombiObject[group][procedure][combinationsArr[1]].amount.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, amount);
		});
		machCombiObject[group][procedure][combinationsArr[1]].workingWidth.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, workingWidth);
		});
		//}
	};

	combination.onchange = function () {
		var group = document.getElementById('procedure.group').value;
		var procedure = document.getElementById('procedure.procedure').value;
		var combination = document.getElementById('procedure.combination').value;
		var amount = document.getElementById('procedure.amount');
		var workingWidth = document.getElementById('procedure.workingWidth');
		// delete exisiting amounts and working widths
		amount.innerHTML = '';
		workingWidth.innerHTML = '';
		// populate amount and working widht with new values
		machCombiObject[group][procedure][combination].amount.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, amount);
		});
		machCombiObject[group][procedure][combination].workingWidth.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, workingWidth);
		});
	};

	// handle accept button
	var acceptButton = document.getElementById('buttonOk');
	acceptButton.onclick = function () {
		console.log(trArray.length)
		for (var i = 0; i < trArray.length; i++) {
			srcTable.removeChild(trArray[i])
		}

		box.classList.toggle('hide');
		blur.classList.toggle('hide');
	};

	// handle cancel button
	var cancelButton = document.getElementById('buttonCancel');
	cancelButton.onclick = function () {
		box.classList.toggle('hide');
		blur.classList.toggle('hide');
	};
}