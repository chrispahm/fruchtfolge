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
			var allPlotsCropsIds = [];
			var timePeriod = 0;

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
					else if (Number(fieldsObject[field].quality) < quality && Number(fieldsObject[field].quality) !== 0) {
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
				var resistance = soilTypes[fieldsObject[field].soilType];

				Object.keys(crops).forEach(function (crop) {
					if (crop == '_rev' || crop == '_id') return
					var ids = [];
					var yearCount = 0;

					crops[crop].procedures.forEach(function (procedure, prodIndex) {
						var idString = '';
						var groupId = procedure.group;
						//if (groupId == -1) return
						var procedureId = procedure.procedure;
						var combinationId = procedure.combination;
						var months = ["JAN1", "JAN2", "FEB1", "FEB2", "MRZ1", "MRZ2", "APR1", "APR2", "MAI1", "MAI2", "JUN1", "JUN2", "JUL1", "JUL2", "AUG1", "AUG2", "SEP1", "SEP2", "OKT1", "OKT2", "NOV1", "NOV2", "DEZ1", "DEZ2"];
						
						// Check in which year the procedure is
						if (crops[crop].procedures[prodIndex + 1] && months.indexOf(procedure.month) <= months.indexOf(crops[crop].procedures[prodIndex + 1].month)) {
							crops[crop].procedures[prodIndex].year = yearCount;
						}
						else if (crops[crop].procedures[prodIndex + 1]) {
							yearCount++;
							//console.log(procedure.month, " ", crops[crop].procedures[prodIndex + 1].month, " ", yearCount);
							crops[crop].procedures[prodIndex].year = yearCount;
						}
						else {
							crops[crop].procedures[prodIndex].year = yearCount;
							//console.log(yearCount)
						}

						// update total Growing period length to highest figure
						if (yearCount > timePeriod) timePeriod = yearCount;

						if (groupId == -1 || typeof machCombiIds[groupId][procedureId] == 'undefined' || typeof machCombiIds[groupId][procedureId][combinationId] == 'undefined' ) {
							ids.push('notAvail')
							//console.log(groupId, " ", procedureId);
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
							//amount = Number(procedure.amount[0]).toFixed(1);
							amount = getValue(Number(amount), machCombiIds[procedure.group][procedure.procedure][procedure.combination].amount)
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
					if (possibleCrops.indexOf(crop) > -1) {
						plotsCropsIds.push([field,crop, ids, fieldsObject[field].size, fieldsObject[field].distance])
					}
					allPlotsCropsIds.push([field,crop, ids, fieldsObject[field].size, fieldsObject[field].distance])
				})
			});

			new PouchDB(couchPath + '/procedures2').bulkGet(requests
			).then(function (results) {
				var resultAll = calcGM(allPlotsCropsIds);
				var resultSolver = calcGM(plotsCropsIds);
				
				function calcGM (input) {
					var plotsCropsGM = {};
					//console.log(time2);

					input.forEach(function (combi) {
						var plot = combi[0];
						var crop = combi[1];
						var ids = combi[2];
						var size = combi[3];
						var distance = combi[4];

						// adjust yield to sqr in future
						var revenue = Number(crops[crop].yield) * Number(crops[crop].price);
						var directCosts = Number(crops[crop].variableCosts);
						var costsTime = calcMachineCosts(ids);
						var machCosts = costsTime[0];
						var timeCons = costsTime[1];
						var timeDet = costsTime[2];
						var variableCosts = (directCosts + machCosts + (machCosts / 12 * 3 * 0.03));

						// calculate workload
						//var workLoad = calcWorkLoad(ids);
						
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
							plotsCropsGM[plot][crop].time = timeCons;
							plotsCropsGM[plot][crop].timeDet = timeDet;
							//plotsCropsGM[plot][crop].size = size;
							//plotsCropsGM[plot][crop].distance = distance;
						}
						function calcMachineCosts(ids) {
							var costs = 0;
							var time = [];
							var time2 = [];
							//console.log(timePeriod)
							for (var i = 0; i <= timePeriod; i++) {
								time.push({JAN1: 0, JAN2: 0, FEB1: 0, FEB2: 0, MRZ1: 0, MRZ2: 0, APR1: 0, APR2: 0, MAI1: 0, MAI2: 0, JUN1: 0, JUN2: 0, JUL1: 0, JUL2: 0, AUG1: 0, AUG2: 0, SEP1: 0, SEP2: 0, OKT1: 0, OKT2: 0, NOV1: 0, NOV2: 0, DEZ1: 0, DEZ2: 0 })
								time2.push({JAN: 0, FEB: 0, MRZ: 0, APR: 0, MAI: 0, JUN: 0, JUL: 0, AUG: 0, SEP: 0, OKT: 0, NOV: 0, DEZ: 0})
							}

							ids.forEach(function (id, no) {
								var index = requestArray.indexOf(id);
								var month = crops[crop].procedures[no].month;
								if (index > -1 && results.results[index].docs[0].ok) {
									var procedure = results.results[index].docs[0].ok;
									procedure.steps.forEach(function (step) {
										// As KTBL calculates with a diesel price of 0.7 Euro, the price was increased to 1.162,
										// then deducted by the tax reduction of 214.8 Euro / 1000 liter -> efficte price 0.9472
										// source ADAC dieselprice
										// https://www.adac.de/infotestrat/tanken-kraftstoffe-und-antrieb/kraftstoffpreise/kraftstoff-durchschnittspreise/default.aspx
										// source tax reduction, Energiesteuergesetz (EnergieStG) § 57 Steuerentlastung für Betriebe der Land- und Forstwirtschaft
										// https://www.gesetze-im-internet.de/energiestg/__57.html
										//costs += Number(step.maintenance) + Number(step.lubricants);
										var lubricants = Number(step.fuelCons) * 0.9472;
										if (lubricants == 0) lubricants = Number(step.lubricants)
										costs += Number(step.maintenance) + lubricants;
										// add time consumption to apropriate month
										time[month] += step.time * Number(size);
										//console.log(crops[crop].procedures[no].year)
										//console.log(crops[crop].procedures[no])
										//console.log(procedure)
										//console.log(id)
										//console.log(ids);
										//console.log(crop)
										time2[crops[crop].procedures[no].year][month.slice(0, -1)] += Number((step.time * Number(size)).toFixed(2));
									});
								}
								else {
									var procedure = crops[crop].procedures[no].steps
									procedure.forEach(function (step) {
										//costs += Number(step.maintenance) + Number(step.lubricants) + Number(step.services);
										var lubricants = Number(step.fuelCons) * 0.9472;
										if (lubricants == 0) lubricants = Number(step.lubricants)
										costs += Number(step.maintenance) + lubricants + Number(step.services);
										// add time consumption to apropriate month
										time[month] += Number(step.time) * Number(size);
										time2[crops[crop].procedures[no].year][month.slice(0, -1)] += Number((Number(step.time) * Number(size)).toFixed(2));
									});
								}
							});
							return [costs, time2, time];
						}
					})
					return plotsCropsGM;
				}		
				//function calcWorkLoad(ids, no) {

					//}

				resolve([resultSolver, resultAll]);
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
	})
}
