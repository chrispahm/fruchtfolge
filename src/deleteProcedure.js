function deleteProcedure(e) {
	//console.log(e)
	var trClass = e.parentElement.classList.value;
	var cropName = trClass.split(';')[0];
	var procedureIndex = Number(trClass.split(';')[1]);
	var srcTable = e.parentElement.parentElement;
	var trList = document.getElementsByClassName(trClass);
	// get ids of production step
	var groupId = trList[0].getAttribute('name').split(';')[0];
	var procedureId = trList[0].getAttribute('name').split(';')[1];
	var combinationId = trList[0].getAttribute('name').split(';')[2];

	var trArray = [];
	for (var i = 0; i < trList.length; i++) {
		trArray.push(trList[i]);
	}

	profile.get('crops').then(function (crops) {
		// delete procedure in profile information
		//Object.keys(crops[cropName].procedures).forEach(function (procedure, index) {
		//	if (procedure.group == groupId && procedure.procedure == procedureId && procedure.combination == combinationId && procedureIndex == index) {
				crops[cropName].procedures.splice(procedureIndex, 1);
		//	}
		//})
		
		// delete previous entry
		for (var i = 0; i < trArray.length; i++) {
			srcTable.removeChild(trArray[i])
		}

		// update row names
		var rowsCrop = srcTable.getElementsByTagName('tr');
		var count = 0;
		crops[cropName].procedures.forEach(function (procedure, j) {
			var color = '#ECECEC';
			if (isEven(j)) color = '#F5F5F5';
			rowsCrop[count].classList.value = cropName + ';' + j;
			rowsCrop[count].style.background = color;
			count++;
			procedure.steps.forEach(function (step, m) {
				rowsCrop[count].classList.value = cropName + ';' + j;
				rowsCrop[count].style.background = color;
				count++;
			});
		});

		function isEven(n) {
		   return n % 2 == 0;
		}
				
		return profile.put(crops);
	});
}