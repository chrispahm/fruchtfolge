profile.bulkGet({
		docs: [
			{id: 'fields'},
			{id: 'crops'}
		]
}).then(function (doc) {
	var fieldsObject = doc.results[0].docs[0].ok;
	var fields = Object.keys(doc.results[0].docs[0].ok);
	var crops = doc.results[1].docs[0].ok;
	
	var requestArray = [];
	var plotsCropsIds = [];

	// get possible subsequent crops per plot
	fields.forEach(function (field) {
		if (field == '_rev' || field == '_id') {
			return;
		}
		// Get previous crops from field
		// ToDo: store most recent year somewhere in DB in future
		var previousCrops = [fieldsObject[field]['2017'], fieldsObject[field]['2016'], fieldsObject[field]['2015']];

		// Get possible subsequent crops
		// if non are present, put all possible combinations in
		if (typeof crops[previousCrops[0]] == 'undefined') {
			var subseqCrops = Object.keys(crops).slice(0,-2);
		}
		else {
			var subseqCrops = crops[previousCrops[0]].subseqCrops;
		}
		var possibleCrops = [];

		subseqCrops.forEach(function (option) {
			if (Object.keys(crops).indexOf(option) == -1) {
				return;
			}
			var rotBreak = Number(crops[option].rotBreak);
			var quality = Number(crops[option].quality);
			var rootCrop = crops[option].rootCrop;

			// check if crop option was grown inside rotational break period
			if (previousCrops.slice(0, rotBreak -1).indexOf(option) > -1) {
				return;
			}
			// check if soil quality is sufficient
			else if (Number(fieldsObject[field].quality) < quality) {
				return;
			}
			// check if root crop
			else if (crops[option].rootCrop == true && fieldsObject[field].rootCrop == false) {
				return;
			}
			// if all conditions are met
			else {
				possibleCrops.push(option)
			}
		});

			return function (field, possibleCrops) {
				var size = fieldsObject[field].size
				var distance = 
				var resistance = 
				var yields = 
			}
	});


	//function dbPlotCrop(plot,cropOptions) {
	//	console.log(plot + ' ' + cropOptions);
	//}
});

function getSize(size) {
	
}