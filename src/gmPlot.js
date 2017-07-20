function gmPlot() {
	return new Promise(function(resolve, reject) {
		Promise.all([profile.bulkGet({
				docs: [
					{id: 'fields'},
					{id: 'crops'}
				]
		}), new PouchDB(couchPath + '/recommendations')
		.get('machCombiIds')])
		.then(function (doc) {
			var fieldsObject = doc[0].results[0].docs[0].ok;
			var fields = Object.keys(doc[0].results[0].docs[0].ok);
			var crops = doc[0].results[1].docs[0].ok;
			var machCombiIds = doc[1];

			var soilTypes = {"Reinsande (ss)": "leicht", "Lehmsande (ls)": "leicht", "Schluffsande (us)": "leicht", "Sandlehme (sl)": "mittel", "Normallehme (ll)": "mittel", "Tonlehme (tl)": "mittel", "Lehmschluffe (lu)": "schwer", "Tonschluffe (tu)": "schwer", "Schlufftone (ut)": "schwer", "Moore (mo)": "schwer", "Watt": "schwer", "Siedlung": "mittel", "Abbauflächen": "mittel", "Gewässer": "mittel"}
			var requestArray = [];
			var requests = {docs: []};
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
						var groupId = procedure.group;
						if (groupId == -1) return
						var procedureId = procedure.procedure;
						var combinationId = procedure.combination;
						
						if (typeof machCombiIds[groupId][procedureId] == 'undefined' || typeof machCombiIds[groupId][procedureId][combinationId] == 'undefined' ) {
							ids.push('notAvail')
							return
						}
						else {
							var workingWidth = machCombiIds[procedure.group][procedure.procedure][procedure.combination].workingWidth[0]
						}
						var amount = procedure.amount[0];
						if (procedure.amount[0] == '' || typeof amount == 'undefined') {
							amount = machCombiIds[procedure.group][procedure.procedure][procedure.combination].amount[0]
						}
						else if (Number(procedure.amount !== 'NaN')){
							amount = Number(procedure.amount[0]).toFixed(1);
						}

						if (machCombiIds[procedure.group][procedure.procedure][procedure.combination].resistance.indexOf(resistance) == -1) {
							resistance = machCombiIds[procedure.group][procedure.procedure][procedure.combination].resistance[0];
						}
						
						idString = groupId + '/' + 
									procedureId + '/' +  
									combinationId + '/' + 
									size + '/' +  resistance + '/' +  distance + '/' + 
									amount + '/' + 
									workingWidth;
						ids.push(idString);
						if (requestArray.indexOf(idString) == -1) {
							requestArray.push(idString);
							requests.docs.push({id: idString});
						}
					})
					plotsCropsIds.push([field,crop, ids, fieldsObject[field].size, fieldsObject[field].distance])
				})
			});

			new PouchDB('http://v-server-node.ilb.uni-bonn.de:5984' + '/procedures2').bulkGet(requests
			).then(function (results) {
				var plotsCropsGM = {};

				plotsCropsIds.forEach(function (combi) {
					var plot = combi[0];
					var crop = combi[1];
					var ids = combi[2];
					var size = combi[3];
					var distance = combi[4];

					// adjust yield to sqr in future
					var revenue = Number(crops[crop].yield) * Number(crops[crop].price);
					var directCosts = Number(crops[crop].variableCosts);
					var machCosts = calcMachineCosts(ids);
					var variableCosts = (directCosts + machCosts + (machCosts / 12 * 3 * 0.03));
					
					if (plotsCropsGM[plot]) {
						if (plotsCropsGM[plot][crop]) {
							write();
						}
						else {
							plotsCropsGM[plot][crop] = {};
							write();
						}
					}
					else {
						plotsCropsGM[plot] = {};
						plotsCropsGM[plot][crop] = {};
						write();
					}
					function write() {
						plotsCropsGM[plot][crop].gm = revenue - variableCosts;
						plotsCropsGM[plot][crop].gmTot = (revenue - variableCosts) * Number(size);
						plotsCropsGM[plot][crop].revenue = revenue;
						plotsCropsGM[plot][crop].variableCosts = variableCosts;
						plotsCropsGM[plot][crop].directCosts = directCosts;
						//plotsCropsGM[plot][crop].size = size;
						//plotsCropsGM[plot][crop].distance = distance;
					}
					function calcMachineCosts(ids) {
						var costs = 0;

						ids.forEach(function (id, no) {
							var index = requestArray.indexOf(id);
							if (index > -1 && results.results[index].docs[0].ok) {
								var procedure = results.results[index].docs[0].ok;

								procedure.steps.forEach(function (step) {
									// As KTBL calculates with a dieselprice of 0.7 Euro, the price was increased to 1.162,
									// then deducted by the tax reduction of 214.8 Euro / 1000 liter -> efficte price 0.9472
									// source ADAC dieselprice
									// https://www.adac.de/infotestrat/tanken-kraftstoffe-und-antrieb/kraftstoffpreise/kraftstoff-durchschnittspreise/default.aspx
									// source tax reduction, Energiesteuergesetz (EnergieStG) § 57 Steuerentlastung für Betriebe der Land- und Forstwirtschaft
									// https://www.gesetze-im-internet.de/energiestg/__57.html
									//costs += Number(step.maintenance) + Number(step.lubricants);
									var lubricants = Number(step.fuelCons) * 0.9472;
									if (lubricants == 0) lubricants = Number(step.lubricants)
									costs += Number(step.maintenance) + lubricants;
								});
							}
							else {
								var procedure = crops[crop].procedures[no].steps.forEach(function (step) {
									//costs += Number(step.maintenance) + Number(step.lubricants) + Number(step.services);
									var lubricants = Number(step.fuelCons) * 0.9472;
									if (lubricants == 0) lubricants = Number(step.lubricants)
									costs += Number(step.maintenance) + lubricants + Number(step.services);
								});
							}
						});
						return costs;
					}
				})

				resolve(plotsCropsGM);
				//console.log(results)


			}).catch(console.log.bind(console));
			//console.log(plotsCropsIds);
			//console.log(requests);
		});

		function getValue(goal, array) {
			var closest = array.reduce(function (prev, curr) {
			  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev);
			});
				return closest
		}		
	}
}
