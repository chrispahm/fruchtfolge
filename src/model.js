function createModel(elem) {
	return new Promise(function (resolve, reject) {
		Promise.all([gmPlot(), profile.bulkGet({
				docs: [
					{id: 'fields'},
					{id: 'crops'}
				]
		})]).then(function (response) {
			// --------------------------
			// create table and pie chart
			// --------------------------
			var gmPlot = response[0][0];
			var gmPlotAll = response[0][1];
			var fields = response[1].results[0].docs[0].ok;
			var crops = response[1].results[1].docs[0].ok;
			// var restrictions = response[1].results[2].docs[0].ok;
			
			// get total ha size
          	var totalHa = 0;
          	Object.keys(fields).forEach(function (plot) {
          		if (fields[plot].size) {
          			totalHa += Number(fields[plot].size);
          		}
          	})

			var model = {
	            "name": "Fruchtfolge",
	            "optimize": "gm",
	            "opType": "max",
	            "constraints": {
	            	"efa": {
	            		"min": totalHa * 0.05
	            	},
	            	[toHex("Mais").substring(0,8)]: {
	            		"min": 50
	            	},
	            	[toHex("Acker-/Puff-/Pferdebohne").substring(0,8)]: {
	            		"min": 20
	            	},
	            	[toHex("Winterweizen").substring(0,8)]: {
	            		"min": 30
	            	}
	            },
	            "variables": {},
	            "ints": {},
	            "binaries": {}
          	}
          	var assign = {};
          	// create basic model with all crop options per plot. Only 1 crop possible per plot
          	Object.keys(gmPlot).forEach(function (plot, indexPlot) {
          		//var abbField = 'f'+ toHex(plot).substring(0,4);
          		var abbField = 'f' + indexPlot;
          		model.constraints[abbField] = {'max': 1};
          		//model.constraints[abbField] = {'min': 1};

          		Object.keys(gmPlot[plot]).forEach(function (crop, indexCrop) {
          			var abbCrop = 'c' + indexCrop;
          			var abbCombi = abbField + abbCrop
          			//var abbCombi = "f" + toHex(plot).substring(0,4) + 'c' + toHex(crop).substring(0,4);
          			//var abbCrop = 'c' + toHex(crop).substring(0,4);

          			assign[abbCombi] = {
          				"name": fields[plot].name || 'Unknown',
          				"field": plot,
          				"crop": crop
          			}

          			model.variables[abbCombi] = {
          				[abbField]: 1,
          				[toHex(crop).substring(0,8)]: fields[plot].size,
          				"efa": crops[crop].efaFactor * fields[plot].size,
          				"gm": gmPlot[plot][crop].gmTot
          			}

          			model.binaries[abbCombi] = 1;

          			if (!model.constraints[toHex(crop).substring(0,8)]) {
          				model.constraints[toHex(crop).substring(0,8)] = {
          					'max': crops[crop].maxShare * totalHa
          				};
          			}
          			else {
          				model.constraints[toHex(crop).substring(0,8)].max = crops[crop].maxShare * totalHa;
          			}
          			
          		});
          	});
          	//console.log(model)
          	return Promise.all([solver.solveNEOS(model, 0, elem), 
          						Promise.resolve(assign), 
          						Promise.resolve(gmPlot),
          						Promise.resolve(fields),
          						Promise.resolve(crops),
          						Promise.resolve(totalHa),
          						Promise.resolve(gmPlotAll),
          						])
          	//.then(function(result){
			//	resolve(result)
			//})
		}).then(function (res) {
			var results = res[0];
			var assign = res[1];
			var gmPlot = res[2];
			var fields = res[3];
			var crops = res[4];
			var totalHa = res[5];
			var gmPlotAll = res[6];

			var cropAlloc = {};
			var cropSum = {};
			var shares = {};

			var sumHa = 0;
			Object.keys(results).forEach(function (combi) {
				if (combi == 'bounded' || combi == 'feasible' || combi == 'result') return

				if (results[combi] > 0) {
					var field = assign[combi].field;
					var crop = assign[combi].crop;
					var name = assign[combi].name;

					cropAlloc[field] = {
						[crop]: gmPlot[field][crop].gmTot,
						"crop": crop,
						"name": name
					};

					shares[crop] = Number(crops[crop].maxShare) * totalHa;

					if (fields[field].size) {
						sumHa += Number(fields[field].size);
						if (cropSum[crop]) {
							cropSum[crop] += Number(fields[field].size);
						}
						else {
							cropSum[crop] = Number(fields[field].size);
						}
					}
				}
			});

			return Promise.all([Promise.resolve(cropAlloc), 
								Promise.resolve(cropSum), 
								Promise.resolve(shares), 
								Promise.resolve(gmPlot), 
								Promise.resolve(sumHa), 
								Promise.resolve(results),
								Promise.resolve(fields),
								Promise.resolve(crops),
								Promise.resolve(gmPlotAll),
								])
		}).then(function (res) {
			var cropAlloc = res[0];
			//console.log(cropAlloc)
			var cropSum = res[1];
			var shares = res[2];
			var gmPlot = res[3];
			var sumHa = res[4];
			var results = res[5];
			//console.log(results)
			var fields = res[6];
			var crops = res[7];
			var gmPlotAll =res[8];

			var tableDiv = document.getElementById("tabelle");
		    var table = document.createElement('TABLE');
		    var tableHead = document.createElement('THEAD');
		    var tableBody = document.createElement('TBODY');

		    table.appendChild(tableHead);
		    table.appendChild(tableBody);

		    var headRow = ['Feldname',
		    			   'Größe [ha]',
		    			   'Entfernung [km]',
		    			   //'Hauptfrucht 2016',
		    			   'Hauptfrucht 2017',
		    			   'Empfehlung 2018'];

		    headRow.forEach(function (cell) {
		        var col = document.createElement('COL');
		        table.appendChild(col);
		    });

		    // create columns
		    var tr = document.createElement('TR');
    		tableHead.appendChild(tr);
    		headRow.forEach(function (cell) { 
    			var th = document.createElement('TH');
    			th.appendChild(document.createTextNode(cell));
    			tr.appendChild(th);
    		});

    		// create rows
    		Object.keys(fields).forEach(function (plot) {
    			if (fields[plot].size) {
	    			var tr = document.createElement('TR');

	    			if (fields[plot].name) createTD(fields[plot].name, tr);
	    			else createTD('Ohne Bezeichnung', tr);

	    			createTD(fields[plot].size, tr);
	    			createTD(parseFloat(fields[plot].distance).toFixed(1), tr);
	    			//createTD(fields[plot]['2016']);
	    			createTD(fields[plot]['2017'], tr);
	    			if (cropAlloc[plot]) createTD(cropAlloc[plot].crop, tr);
	    			else createTD('', tr)

	    			tableBody.appendChild(tr);
    			}
    		});
    		// create sum row
    		var trSum = document.createElement('TR');
    		createTD('Summe', trSum);
    		createTD('', trSum);
    		createTD(sumHa.toFixed(1), trSum);
    		// total GM of previous year
    		createTD((function () {
    			var gm = 0;
    			Object.keys(fields).forEach(function (plot) {
    				if (fields[plot]['2016']) gm += gmPlotAll[plot][fields[plot]['2016']].gmTot;
    			});
    			return gm.toFixed(1);
    		})(), trSum);
    		// total GM of this year
    		createTD((function () {
    			var gm = 0;
    			Object.keys(fields).forEach(function (plot) {
    				if (cropAlloc[plot]) gm += cropAlloc[plot][cropAlloc[plot].crop];
    			});
    			return gm.toFixed(1);
    		})(), trSum);

    		tableBody.appendChild(trSum);
    		tableDiv.appendChild(table);

    		var cropColor = createChart(cropSum);

		    var spalte0 = document.getElementById("tabelle").getElementsByTagName("table")[0].rows[0].cells
		    var spalte1 = document.getElementById("tabelle").getElementsByTagName("table")[0].rows
		    for (var i = 1; i < spalte1.length; i++) {
		    	var cells = spalte1[i].cells
		    	for (j=0; j < spalte0.length; j++) {
			        breite = spalte0[j].offsetWidth;
			        cells[j].style.width = breite - 2 + "px";
			    }
		    }

		    return Promise.all([Promise.resolve(cropAlloc), 
						 Promise.resolve(fields),
						 profile.get('info'),
						 Promise.resolve(cropColor)]);

		    function createTD (input, tr) {
    				if (!input) var input = ''
    				var td = document.createElement('TD');
		            td.appendChild(document.createTextNode(input));
		            tr.appendChild(td);
		            //td.ondblclick = function() { bearbeiten(this); };
	    	}
		}).then(function (res) {
			// create map with results
			var cropAlloc = res[0];
			var fields = res[1];
			var info = res[2];
			var cropColor = res[3];

			var language = 'de'
			mapboxgl.accessToken = 'pk.eyJ1IjoidG9mZmkiLCJhIjoiY2l3cXRnNHplMDAxcTJ6cWY1YWp5djBtOSJ9.mBYmcCSgNdaRJ1qoHW5KSQ';

			var map = new mapboxgl.Map({
			    container: 'mapResults',
			    //style: 'mapbox://styles/mapbox/satellite-streets-v9?optimize=true',
			    // mapbox://styles/toffi/cj5gxt7ug3o542rph58zh8v40
			    style: 'mapbox://styles/toffi/cj5i5it2z4s5p2rmo8rsvdypm',
			    center: info.homeCoords,
			    zoom: 13,
			    //dragPan: false,
			    dragRotate: false
			});
			map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
			console.log(cropColor)
			// ields[plot].name || p
			map.on('load', function () {
				var featureCollection = [];

				Object.keys(cropAlloc).forEach(function (plot) {
					var feature = fields[plot].polygon;
					feature.crop = cropAlloc[plot].crop;
					feature.properties = {
						"description": '<p>' + fields[plot].name + ", " + cropAlloc[plot].crop + '</p>',
						"crop": cropAlloc[plot].crop
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
				map.addSource("plots", collectionObject);

			    Object.keys(cropColor).forEach(function	(crop,index) {

			    	// add layer filling the inside of each plot per crop
			    	map.addLayer({
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
				    map.addLayer({
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

				    map.on('mouseenter', crop, function(e) {
				        // Change the cursor style as a UI indicator.
				        map.getCanvas().style.cursor = 'pointer';

				        // Populate the popup and set its coordinates
				        // based on the feature found.
				        var center = turf.centerOfMass(e.features[0].geometry).geometry.coordinates
				        //console.log(e.features[0])
				        popup.setLngLat(center)
				            .setHTML(e.features[0].properties.description)
				            .addTo(map);
				    });

				    map.on('mouseleave', crop, function() {
				        map.getCanvas().style.cursor = '';
				        popup.remove();
				    });
			    });
			    //var center = turf.bbox(collectionObject.data)
			    //map.fitBounds(center, {animate: false, padding: {top: 10, bottom:25, left: 15, right: 5}});
				
	
			})
			
		}).catch(console.log.bind(console));
	})
}