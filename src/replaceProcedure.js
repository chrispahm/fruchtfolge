function replaceProcedure (e) {
	var index = e.srcElement.parentElement.classList.value;
	var srcTable = e.srcElement.parentElement.parentElement;
	var trArray = document.getElementsByClassName(index);
	var procedureName = trArray[0].children[2].innerHTML;
	var combinationName = trArray[1].children[2].innerHTML;
	var groupName, amountName, workingWidthName;

	// match preselected values with replaced procedure
	var db = new PouchDB(couchPath + '/recommendations');
	db.get('machCombiObject').then(function (doc) {
		Object.keys(doc).forEach(function (item) {
			if (procedureName in doc[item]) {
				groupName = item;
				amountName = doc[item].amount[0]
				workingWidthName = doc[item].workingWidth[0]
			}
		});
	});

	// populate dropdown menus
	
	// populate replacement popup 
	// group, procedure, combination, amount, working width
	var group = document.getElementById('procedure.group');
	var procedure = document.getElementById('procedure.procedure');
	var combination = document.getElementById('procedure.combination');
	var amount = document.getElementById('procedure.amount');
	var workingWidth = document.getElementById('procedure.workingWidth');
	// show replacement popup
	var box = document.getElementById('replacementBox');
	box.classList.remove('hide');

	// button 'accept'
	//accept.onclick = function ()
	
	// button 'cancel'
	// cancel.onlick = function ()
}