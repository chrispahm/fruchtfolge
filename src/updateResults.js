function updateResults (plot, crop) {
	// hide alert box
	var alertBox = document.getElementById("alerts-box");
	var oldAlerts = alertBox.innerHTML;
	alertBox.style.maxHeight = 0;
	// get relevant data from db
	profile.bulkGet({
		docs: [
				{id: "cropSum"},
				{id: "shares"},
				{id: "gmPlot"},
				{id: "cropAlloc"},
				{id: "adjCropAlloc"},
				{id: "gmPlotAll"},
				{id: "optimum"},
				{id: 'fields'},
				{id: 'constraints'},
				{id: 'timeCur'},
				{id: 'crops'}
			]}).then(function (docs) {
				// declare variables from db query
				var cropSum = docs.results[0].docs[0].ok;
				var shares = docs.results[1].docs[0].ok;
				var gmPlot = docs.results[2].docs[0].ok;
				var cropAlloc = docs.results[3].docs[0].ok;
				var adjCropAlloc = docs.results[4].docs[0].ok;
				var gmPlotAll = docs.results[5].docs[0].ok;
				var optimum = docs.results[6].docs[0].ok;
				var fields = docs.results[7].docs[0].ok;
				var constraints = docs.results[8].docs[0].ok;
				var timeCur = docs.results[9].docs[0].ok;
				var crops = docs.results[10].docs[0].ok;


				// ---------------------------------------
				// First step - update table gross margin
				// ---------------------------------------
				// get gross margin table cell
				var gmCell = document.getElementsByClassName("resultsTable")[0].rows[document.getElementsByClassName("resultsTable")[0].rows.length -1].cells[4];
				// assess whether an adjustment to the totla GM has been made, or optimum value should be used
				var curGM = optimum.cur;

				var oldCrop;
				if (!adjCropAlloc[plot]) oldCrop = gmPlotAll[plot][fields[plot]['2017']].gmTot;
				else oldCrop = adjCropAlloc[plot][adjCropAlloc[plot].crop]
				// create new total GM value -> deduct "old" crops gross margin from total gm and add "new" crops gm
 				var newGMValue = curGM - oldCrop + gmPlotAll[plot][crop].gmTot;

 				// update current gross margin
 				optimum.cur = newGMValue;
 				// update cell value
 				gmCell.innerHTML = newGMValue.toFixed(1);


 				// ---------------------------------------
 				// Second step - update crop share charts
 				// ---------------------------------------
 				// deduct field size from old crops share
 				cropSum[adjCropAlloc[plot].crop] = cropSum[adjCropAlloc[plot].crop] - fields[plot].size;
 				// add field size to new crops share
 				cropSum[crop] = cropSum[crop] + fields[plot].size;

 				// update crop shares pie chart

 				// - remove old data
 				cropSharesPie.data.datasets[0].data = [];
 				cropSharesPie.data.datasets[0].backgroundColor = [];
 				cropSharesPie.data.labels = [];

 				// - sort data
 				var dataUnsorted = [];
 				Object.keys(cropSum).forEach(function (share) {
			    	if (share == "_rev" || share == "_id") return
						dataUnsorted.push([parseFloat(cropSum[share].toFixed(1)), share]);
				});
				var sorted = dataUnsorted.sort(Comparator);
				var colors = ["#294D4A", "#4A6D7C", "#7690A5", "#79ae98", "#BBE29D", "#9DD5C0", '#B5DCE1', "#D0D1D3", "#B5DCE1"]
			    // - add new data
			    sorted.forEach(function (item, index) {
					cropSharesPie.data.datasets[0].data.push(cropSum[item[1]].toFixed(2));
					cropSharesPie.data.labels.push(item[1]);
					if (cropColor[item[1]]) {
						var color = cropColor[item[1]]
					}
					else {
						var color = colors[colors.length - index];
						cropColor[item[1]] = colors[colors.length - index];
					}
					cropSharesPie.data.datasets[0].backgroundColor.push(color);
				})

			    // - update chart
			    cropSharesPie.update();

			    // ---------------------------------------
 				// Third step - update time line chart
 				// ---------------------------------------
 				// - update data
 				timeCur.time.forEach(function (year, index) {
 					Object.keys(year).forEach(function (month) {
 						// delete old crop time requirements and add new crops time requirements
 						timeCur.time[index][month] = timeCur.time[index][month] - gmPlotAll[plot][adjCropAlloc[plot].crop].time[index][month] + gmPlotAll[plot][crop].time[index][month];
 					});
 				});

 				// - delete existing crop time requirement
 				timeLineChart.data.datasets[1].data = [];

 				// add new data to chart
 				timeLineChart.data.datasets[1].data = [Number(timeCur.time[0].AUG.toFixed(2)), Number(timeCur.time[0].SEP.toFixed(2)), Number(timeCur.time[0].OKT.toFixed(2)), Number(timeCur.time[0].NOV.toFixed(2)), Number(timeCur.time[0].DEZ.toFixed(2)), Number(timeCur.time[1].JAN.toFixed(2)), Number(timeCur.time[1].FEB.toFixed(2)), Number(timeCur.time[1].MRZ.toFixed(2)), Number(timeCur.time[1].APR.toFixed(2)), Number(timeCur.time[1].MAI.toFixed(2)), Number(timeCur.time[1].JUN.toFixed(2)), Number(timeCur.time[1].JUL.toFixed(2)), Number(timeCur.time[1].AUG.toFixed(2)), Number(timeCur.time[1].SEP.toFixed(2)), Number(timeCur.time[1].OKT.toFixed(2)), Number(timeCur.time[1].NOV.toFixed(2)), Number(timeCur.time[1].DEZ.toFixed(2))];

 				// update line chart
 				timeLineChart.update();

 				// ---------------------------------------
 				// Fourth step - update map
 				// ---------------------------------------
 				// delete previous source, layer
 				Object.keys(cropColor).forEach(function	(crop,index) {
 					// remove plot
 					mapResults.removeLayer(crop);
 					// remove outline of plot
 					mapResults.removeLayer(index);
 				})

 				mapResults.removeSource("plots")
 				
 				// add new source and layers
 				var featureCollection = [];

				Object.keys(adjCropAlloc).forEach(function (field) {
					if (field === "_id" || field === "_rev") return;
					var feature = fields[field].polygon;
					var cropGrown = adjCropAlloc[field].crop
					if (field === plot) cropGrown = crop;
					feature.crop = cropGrown;
					feature.properties = {
						"description": '<p>' + fields[field].name + ", " + cropGrown + '</p>',
						"crop": cropGrown
					}

					featureCollection.push(feature)
				});

				var collectionObject = {
			        "type": "geojson",
			            "data": {
			            	"type": "FeatureCollection",
			            	"features": featureCollection
			    		}
			    };
				mapResults.addSource("plots", collectionObject);

				// delete previous legend entries
				var container = document.getElementById('crop-legend');
				container.innerHTML = "<h4>Anbaukulturen</h4>";

			    Object.keys(cropColor).forEach(function	(crop,index) {

			    	// add layer filling the inside of each plot per crop
			    	mapResults.addLayer({
				        "id": crop,
				        "type": "fill",
				        "source": "plots",
				        "paint": {
				            "fill-color": cropColor[crop],
				            "fill-opacity": 0.9
				        },
				        "filter": ["==", "crop", crop]
				    });

			    	// add layer filling the outline of each plot per crop
				    mapResults.addLayer({
				        "id": index.toFixed(0),
				        "type": "line",
				        "source": "plots",
				        "paint": {
				            "line-color": cropColor[crop],
				            "line-opacity": 1
				        },
				        "filter": ["==", "crop", crop]
				    });

				    // add crop to legend
				    var container = document.getElementById('crop-legend');
				    var div = document.createElement('div');
				    var span = document.createElement('span');
				    span.style.backgroundColor = cropColor[crop];
				    div.appendChild(span);
				    div.appendChild(document.createTextNode(crop));
				    container.appendChild(div);

					// Create a popup, but don't add it to the map yet.
				    var popup = new mapboxgl.Popup({
				        closeButton: false,
				        closeOnClick: false
				    });

				    mapResults.on('mouseenter', crop, function(e) {
				        // Change the cursor style as a UI indicator.
				        mapResults.getCanvas().style.cursor = 'pointer';

				        // Populate the popup and set its coordinates
				        // based on the feature found.
				        var center = turf.centerOfMass(e.features[0].geometry).geometry.coordinates
				        //console.log(e.features[0])
				        popup.setLngLat(center)
				            .setHTML(e.features[0].properties.description)
				            .addTo(mapResults);
				    });

				    mapResults.on('mouseleave', crop, function() {
				        mapResults.getCanvas().style.cursor = '';
				        popup.remove();
				    });
			    });

 				// ---------------------------------------
 				// Fifth step - show deviation from optimum
 				// 			  - show deviation from constraints
 				// ---------------------------------------
 				//var alertBox = document.getElementById("alerts-box");
 				var wrapperDiv = document.createElement('div');

 				// add deviation from optimum, if any
 				if (optimum.value - newGMValue > 5) {
 					var h2 = document.createElement('h2');
 					h2.innerHTML = "-" + (optimum.value - newGMValue).toFixed(1) + " Euro Differenz zum Optimum";
 					wrapperDiv.appendChild(h2);
 				}
 				else if (optimum.value - newGMValue < -5) {
 					var h2 = document.createElement('h2');
 					h2.style.color = '#79ae98';
 					h2.innerHTML = (newGMValue - optimum.value).toFixed(1) + " Euro Differenz zum Optimum";
 					wrapperDiv.appendChild(h2);
 				}

 				// check constraints
 				constraints.array.forEach(function (constraint) {
 					var sumShare = 0;
 					var cropString = "";
 					constraint[0].forEach(function (cropConstraint, index) {
 						sumShare += cropSum[cropConstraint];
 						var delimeter = ' + ';
 						if (index === constraint[0].length -1) delimeter = ' ';
 						cropString += cropConstraint + delimeter;
 					});

 					if (constraint[1] === "max" && sumShare > constraint[2]) {
 						var constViol = document.createElement("p");
 						constViol.style.margin = "auto";
 						constViol.innerHTML = cropString + "über " + constraint[2] + " ha (" + sumShare.toFixed(1) + " ha aktuell)";
 						wrapperDiv.appendChild(constViol);
 					}
 					else if (constraint[1] === "min" && sumShare < constraint[2]) {
 						var constViol = document.createElement("p");
 						constViol.style.margin = "auto";
 						constViol.innerHTML = cropString + "unter " + constraint[2] + " ha (" + sumShare.toFixed(1) + " ha aktuell)";
 						wrapperDiv.appendChild(constViol);
 					}
 				});

 				// check rotation break / plot & crop
 				Object.keys(fields).forEach(function (field) {
 					if (field === "_id" || field === "_rev") return;
 					// check for current crop select on field
 					var curCrop = adjCropAlloc[field].crop;
 					if (field === plot) curCrop = crop;

 					// Get previous crops from field
					// ToDo: store most recent year somewhere in DB in future
					var previousCrops = [fields[field]['2017'], fields[field]['2016'], fields[field]['2015']];

 					var rotBreak = Number(crops[curCrop].rotBreak);
					var quality = Number(crops[curCrop].quality);
					var rootCrop = crops[curCrop].rootCrop;

					// check if crop was grown inside rotational break period
					if (rotBreak > 0 && previousCrops.slice(0, rotBreak -1).indexOf(curCrop) > -1) {
						var constViol = document.createElement("p");
						constViol.style.margin = "auto";
 						constViol.innerHTML = "Anbaupause für " + curCrop + " auf dem Feld '" + fields[field].name + "' nicht eingehalten";
 						wrapperDiv.appendChild(constViol);
					}

					// check if selected crop is a possible subsequent crop
					var prevYearCrop = fields[field]['2017'];
					if (typeof prevYearCrop !== 'undefined' && Object.keys(crops).indexOf(prevYearCrop) > -1 && crops[prevYearCrop].subseqCrops.indexOf(curCrop) === -1) {
						var constViol = document.createElement("p");
						constViol.style.margin = "auto";
 						constViol.innerHTML = curCrop + " keine mögliche Nachfrucht von " + prevYearCrop + " (" + fields[field].name +")";
 						wrapperDiv.appendChild(constViol);
					}

					// check if soil quality is sufficient
					else if (Number(fields[field].quality) < quality && Number(fields[field].quality) !== 0) {
						var constViol = document.createElement("p");
						constViol.style.margin = "auto";
 						constViol.innerHTML = "Bodenqualität für " + curCrop + " auf dem Feld '" + fields[field].name + "' nicht ausreichend";
 						wrapperDiv.appendChild(constViol);
					}
					// check if root crop
					else if (crops[curCrop].rootCrop == true && fields[field].rootCrop == false) {
						var constViol = document.createElement("p");
						constViol.style.margin = "auto";
 						constViol.innerHTML = "Hackfruchtanbau (" + curCrop + ") auf dem Feld '" + fields[field].name + "' nicht möglich";
 						wrapperDiv.appendChild(constViol);
					}

 				});

 				// animate alert box transition
 				//alertBox.__toggle = !alertBox._toggle;
 				var timer = 0;
 				if (oldAlerts !== "" && oldAlerts !== "<div></div>") timer = 900;
 				setTimeout(function(){ 
 					alertBox.style.maxHeight = "500px";
 					alertBox.innerHTML = "";
 					alertBox.appendChild(wrapperDiv);
 				}, timer);
 				
 				// store changes in adjusted crop allocation object to db
 				adjCropAlloc[plot].crop = crop;
 				adjCropAlloc[plot][crop] = gmPlotAll[plot][crop].gmTot;

 				return profile.bulkDocs([adjCropAlloc, cropSum, optimum, timeCur]);
			});

}