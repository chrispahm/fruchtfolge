function replaceProcedure (e) {
	var index = e.srcElement.parentElement.classList.value;
	var srcTable = e.srcElement.parentElement.parentElement;
	var trArray = document.getElementsByClassName(index);
	var procedureName = trArray[0].children[2].innerHTML;
	var combinationName = trArray[1].children[2].innerHTML;
	var groupName, amountName, workingWidthName;

	function createOptions (item, elem) {
		var option = document.createElement('option');
		option.innerHTML = item;
		option.value = item;
		if (item == groupName || item == procedureName || item == combinationName) {
			option.selected = 'selected';
		}
		elem.appendChild(option);
	}

	//-----------------------------------------------------------------
	//	C R E A T E  I N I T I A L   S T A T E
	//-----------------------------------------------------------------
	// match preselected values with replaced procedure
	var db = new PouchDB(couchPath + '/recommendations');
	db.get('machCombiObject').then(function (doc) {
		Object.keys(doc).forEach(function (item) {
			if (procedureName in doc[item]) {
				groupName = item;
				amountName = doc[item].amount[0];
				workingWidthName = doc[item].workingWidth[0];
			}
		});
		// populate dropdown menus
		var group = document.getElementById('procedure.group');
		Object.keys(doc).forEach(function (item) {
			createOptions(item, group);
		});

		var procedure = document.getElementById('procedure.procedure');
		Object.keys(doc[groupName]).forEach(function (item) {
			createOptions(item, procedure);
		});

		var combination = document.getElementById('procedure.combination');
		Object.keys(doc[groupName][procedureName]).forEach(function (item) {
			createOptions(item, combination);
		});

		var amount = document.getElementById('procedure.amount');
		doc[groupName][procedureName][combinationName].amount.forEach(function (item) {
			createOptions(item, amount);
		});

		var workingWidth = document.getElementById('procedure.workingWidth');
		doc[groupName][procedureName][combinationName].workingWidth.forEach(function (item) {
			createOptions(item, workingWidth);
		});

		// show replacement box popup window
		var box = document.getElementById('replacementBox');
		box.classList.remove('hide');

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
			Object.keys(doc[group]).forEach(function (item) {
				createOptions(item, procedure);
			});
			// delete combination, amount, working width options
			document.getElementById('procedure.combination').innerHTML = '';
			document.getElementById('procedure.amount').innerHTML = '';
			document.getElementById('procedure.workingWidth').innerHTML = '';
		};

		procedure.onchange = function () {
			var group = document.getElementById('procedure.group').value;
			var procedure = document.getElementById('procedure.procedure').value;
			var combination = document.getElementById('procedure.combination');
			// delete current procedure options
			combination.innerHTML = '';
			// populate combinations dropdown with new options
			Object.keys(doc[group][procedure]).forEach(function (item) {
				createOptions(item, combination);
			});
			// delete amount, working width options
			document.getElementById('procedure.amount').innerHTML = '';
			document.getElementById('procedure.workingWidth').innerHTML = '';
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
			doc[group][procedure][combination].amount.forEach(function (item) {
				createOptions(item, amount);
			});
			doc[group][procedure][combination].workingWidth.forEach(function (item) {
				createOptions(item, workingWidth);
			});
		};

		// handle accept button
		var acceptButton = document.getElementById('buttonOk');
		acceptButton.onclick = function () {
			box.classList.toggle('hide');
		};

		// handle cancel button
		var cancelButton = document.getElementById('buttonCancel');
		cancelButton.onclick = function () {
			box.classList.toggle('hide');
		};
	});
}