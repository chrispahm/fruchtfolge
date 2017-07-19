profile.bulkGet({
		docs: [
			{id: 'fields'},
			{id: 'crops'},
			{id: 'machCombiIds'}
		]
}).then(function (doc) {
	var fieldsObject = doc.results[0].docs[0].ok;
	var fields = Object.keys(doc.results[0].docs[0].ok);
	var crops = doc.results[1].docs[0].ok;
	var machCombiIds = doc.results[2].docs[0].ok;

	var soilTypes = {"Reinsande (ss)": "leicht", "Lehmsande (ls)": "leicht", "Schluffsande (us)": "leicht", "Sandlehme (sl)": "mittel", "Normallehme (ll)": "mittel", "Tonlehme (tl)": "mittel", "Lehmschluffe (lu)": "schwer", "Tonschluffe (tu)": "schwer", "Schlufftone (ut)": "schwer", "Moore (mo)": "schwer", "Watt": "schwer", "Siedlung": "mittel", "Abbauflächen": "mittel", "Gewässer": "mittel"}
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

		var size = getValue(fieldsObject[field].size, [1,2,5,10,20,40,80]);
		var distance = getValue(fieldsObject[field].distance, [1,2,3,4,5,6,10,15,20,30]);
		var resistance = soilTypes[fieldsObject[field].soilType]

		possibleCrops.forEach(function (crop) {
			var ids = [];
			crops[crop].procedures.forEach(function (procedure) {
				var idString = '';
				var amount = procedure.amount[0]
				if (amount == '' || typeof amount == 'undefined') amount = '0.0'
				idString = procedure.group + '/' + 
							procedure.procedure + '/' +  
							procedure.combination + '/' + 
							size + '/' +  resistance + '/' +  distance + '/' + 
							amount + '/' + 
							machCombiIds[procedure.group][procedure.procedure][procedure.combination].workingWidth[0];
				ids.push(idString);
				if (requestArray.indexOf(idString) == -1) {
					requestArray.push(idString)
				}
			})
			plotsCropsIds.push([field, crop, ids])
		})
	});

	console.log(plotsCropsIds);
	console.log(requestArray);
	//function dbPlotCrop(plot,cropOptions) {
	//	console.log(plot + ' ' + cropOptions);
	//}
});

function getValue(goal, array) {
	var closest = array.reduce(function (prev, curr) {
	  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
	});
		return closest
}