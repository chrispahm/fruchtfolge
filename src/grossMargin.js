//---------------------------------------------------------
// Name:      toHex
// Purpose:   Hex encodes string
// Args:      string to encode
//---------------------------------------------------------
/*
function toHex (str) {
	var hex= ''
	for (var i=0; i < str.length; i++) {
		hex += str.charCodeAt(i).toString(16);
	}
		return hex
}
*/
function searchValueinObject (object, value ) {
    for( var prop in object ) {
        if( object.hasOwnProperty( prop ) ) {
             if( object[ prop ] === value )
                 return prop;
        }
    }
}

function createCroppingPage () {
  return new Promise(function (resolve,reject) {
	if (!profile) {
		reject("No user signed in")
	}
	return profile.bulkGet({
		docs: [
			{id: 'cropsList'},
			{id: 'crops'}
		]
	}).then(function (doc) {
		// post status to status elem
		document.getElementById('loading-status').innerHTML = "DECKUNGSBEITRÄGE DER ANBAUFRÜCHTE WERDEN ABGEFRAGT";
		// delete previous contents of container elem
		document.getElementById('page4').innerHTML = "<div class='hide' id='blur-costs'></div> <div id='stepProcedures'> <div id='tabelle'></div> <div class='hide' id='replacementBox'> <div id='machInputs'> <label class='labelDropDown' for='procedure.group'>Verfahrensgruppe</label> <select class='replacementDropDown' id='procedure.group'> </select> <label class='labelDropDown' for='procedure.procedure'>Arbeitsverfahren</label> <select class='replacementDropDown' id='procedure.procedure'> </select> <label class='labelDropDown' for='procedure.combination'>Maschinenkombination</label> <select class='replacementDropDown' id='procedure.combination'> </select> <label class='labelDropDown' for='procedure.amount'>Menge</label> <select class='replacementDropDown' id='procedure.amount'> </select> <label class='labelDropDown' for='procedure.workingWidth'>Arbeitsbreite</label> <select class='replacementDropDown' id='procedure.workingWidth'> </select> </div> <button id='buttonOk'>ÜBERNEHMEN</button> <button id='buttonCancel'>ABBRECHEN</button> </div> <div id='subseqCrops'></div> <div id='subseqCropsRight'></div> </div> <div id='LeisteCrops'></div> <input id='weiter-costs' class='weiter-oben' type='button' value='WEITER' /> <script type='text/javascript'> document.getElementById('weiter-costs').onclick = function() {return loadingScreen(constraints, 5, 'weiter-costs', null, 'EINEN AUGENBLICK BITTE') }; </script>";
		document.getElementById('weiter-costs').onclick = function() {return loadingScreen(constraints, 5, 'weiter-costs', null, 'EINEN AUGENBLICK BITTE') };
		if (doc.results[0].docs[0].ok && doc.results[1].docs[0].ok) {
		// If both crops & cropsList
			var crops = doc.results[0].docs[0].ok.array
			var cropsDB = doc.results[1].docs[0].ok

			Object.keys(cropsDB).forEach(function (item) {
				if (crops.indexOf(item) > -1) {
		        	crops.splice(crops.indexOf(item), 1);
		    	}
			})
			if (crops.length > 0) {
				return Promise.resolve(crops)
			}
			else {
				return Promise.resolve(null)
			}
		} else if (doc.results[0].docs[0].ok && doc.results[1].docs[0].error) {
		// If cropsList but no crops
			var crops = doc.results[0].docs[0].ok.array
			return Promise.resolve(crops)
		} else if (doc.results[0].docs[0].error && doc.results[1].docs[0].ok) {
		// If no cropsList but crops
			return Promise.resolve(null)
		} else if (doc.results[0].docs[0].error && doc.results[1].docs[0].error) {
		// If none
			return Promise.resolve(null)
		}
	}).then(function (crops) {
		if (!crops) {
			return Promise.resolve(null)
		}
		var db = new PouchDB(couchPath + '/recommendations')
		return db.bulkGet({
				docs: [
					{id: 'cropObject'},
					{id: 'recommendations'},
					{id: 'cropToKTBL'}
				]
			}).then(function (doc) {
				var value = {a: doc, b: crops}
				return Promise.resolve(value)
			}).catch(console.log.bind(console));
	}).then(function (value) {
		if (!value) {
			return Promise.resolve(null)
		}
		var crops = value.b
		var cropObject = value.a.results[0].docs[0].ok
		var recommendations = value.a.results[1].docs[0].ok
		var cropToKTBL = value.a.results[2].docs[0].ok

		var requests = {docs: []};
		crops.forEach(function (crop) {
			var KTBLname = cropToKTBL[crop];
			if (typeof KTBLname !== 'undefined') {
				var id = cropObject[KTBLname].name + '/' + cropObject[KTBLname].tillage[0]
								   + '/' + cropObject[KTBLname].yield[0];
				requests.docs.push({id: id})
			}
		});

		function createCrops(data) {
			var db = new PouchDB(couchPath + '/crops');
			if (requests.docs.length === 0) return Promise.resolve();

			return db.bulkGet(requests).then(function (docs) {
				docs.results.forEach(function (resultObject, index) {
					var result = resultObject.docs[0].ok;
					var crop = searchValueinObject(cropToKTBL,result['_id'].split('/')[0]);
					var cropDB = {};
					var specification = result.specification;

					cropDB.name = crop;
					cropDB.rotBreak = recommendations[crop].rotBreak

					var subseqCrops = recommendations[crop].subseqCrops
					var array = [];
					subseqCrops.forEach(function (item) {
						if (crops.indexOf(item) > -1) {
							array.push(item)
						}
					})

					cropDB.subseqCrops = array
					cropDB.narrowRot = 'false'
					cropDB.rootCrop = recommendations[crop].rootCrop
					cropDB.efaFactor = recommendations[crop].efaFactor
					cropDB.quality = recommendations[crop].quality
					cropDB.maxShare = recommendations[crop].maxShare
					cropDB.leguminosae = recommendations[crop].leguminosae
					cropDB.procedures = result.specifications

					data[crop] = cropDB;
				});
				return profile.put(data).then(function () {
					return Promise.resolve()
				})
			}).catch(console.log.bind(console));						
		}

		return profile.get('crops').then(function (data) {
			return createCrops(data)
		}).catch(function (err) {
			if (err.name == 'not_found') {
				var cropsStored = {}
				cropsStored['_id'] = 'crops'
				return createCrops(cropsStored);
			}
		});
}).then(function () {
	var promiseArr = []
	return profile.get('crops').then(function (cropsStored) {
		// || typeof cropsStored[crop].price !== 'undefined' || typeof cropsStored[crop].yield !== 'undefined'
		Object.keys(cropsStored).forEach(function (crop) {
			if (crop == '_id' || crop == '_rev'  || cropsStored[crop].price > 0 || cropsStored[crop].yield > 0 ) {
				return
			}
			else {
				return promiseArr.push(new Promise (function (resolve2) {
					var db = new PouchDB(couchPath + '/sgm')
					// ToDo - get price closest to farm
					if (crop == 'Winterweizen') {
						var id = "Weichweizen und Spelz/Deutschland/2016"
					}
					else if (crop == 'Wintergerste' || crop == 'Sommergerste'){
						var id = 'Gerste/Deutschland/2016'
					}
					else if (crop == 'Mais'){
						var id = 'Grünmais (Silagemais)/Deutschland/2016'
					}
					else if (crop == 'Winterroggen' || crop == 'Sommerroggen'){
						var id = 'Roggen/Deutschland/2016'
					}
					else if (crop == 'Acker-/Puff-/Pferdebohne' || crop == 'Erbsen'){
						var id = 'Eiweißpflanzen/Deutschland/2016'
					}
					else if (crop == 'Winterraps' || crop == 'Sommerraps' || crop == 'Raps'){
						var id = 'Raps und Rübsen/Deutschland/2016'
					}
					else {
						var id = crop + '/Deutschland/2016'
					}
					return db.get(id).then(function (result) {
						cropsStored[crop].yield = result.yield
						cropsStored[crop].price = result.price
						cropsStored[crop].variableCosts = result.variableCosts
						return resolve2()
					}).catch(function (err) {
						console.log(err)
						cropsStored[crop].yield = 0
						cropsStored[crop].price = 0
						cropsStored[crop].variableCosts = 0
						return resolve2()
					})
				}))
			}
		})
		return Promise.all(promiseArr).then(function () {
			return profile.put(cropsStored).then(function () {
				return Promise.resolve()
			})
		})
	})
}).then(function () {
	var db = new PouchDB(couchPath + '/recommendations');
	//console.log('machCombiObject')
	return db.get('machCombiObject').then(function (doc) {
		machCombiObject = doc;
		return Promise.resolve()
	}).catch(console.log.bind(console));
}).then(function () {
	return profile.get('crops').then(function (doc) {
		var availCrops = Object.keys(doc);
		availCrops.forEach(function (item, index) {
			if (!(item == '_id' || item == '_rev')) {
				var cropDiv = document.createElement('div')
				cropDiv.setAttribute("name", 'cropGM');
				
				// Tabelle mit Feldern, Groesse, Entfernung etc.
			    var tableDiv = document.getElementById("tabelle")
			    var table = document.createElement('TABLE')
			    var tableHead = document.createElement('THEAD')
			    var tableBody = document.createElement('TBODY')

			    //tableDiv.className = 'expand';
			    table.classList.add(item.toUpperCase());
			    table.appendChild(tableHead);
			    table.appendChild(tableBody);


				var kopfzeile = [];
			    kopfzeile[0] = "Leistungs-/Kostenart"
			    kopfzeile[1] = "Menge [dt]"
			    kopfzeile[2] = "Preis [EUR]"
			    kopfzeile[3] = "Betrag [EUR]"
			    
			    // Columns are created
			    var tr = document.createElement('TR');
			    tableHead.appendChild(tr);
			    for (i = 0; i < kopfzeile.length; i++) {
			        var th = document.createElement('TH');
			        if (i == 0) {
			        	th.width = '50%'
			        }
			        else {
			        	th.width = '22%';
			        }
			        th.appendChild(document.createTextNode(kopfzeile[i]));
			        tr.appendChild(th);
			    }

			    // Rows for direct costs and revenue are created
			    function createRows(content, onclick) {
			    	var tr = document.createElement('TR');
			    	var td0 = document.createElement('TD')

		            td0.appendChild(document.createTextNode(content[0]));
		            td0.style.padding = '0px 0px 0px 10px'
		            //td0.style.width = '198px'
		            tr.appendChild(td0);

		            var td1 = document.createElement('TD')
		            td1.appendChild(document.createTextNode(content[1]));
		            if (content[1] == doc[item].yield) {
		            	td1.ondblclick = function () {
		            		bearbeiten(this, 'yield')
		            	}
		            }
		            td1.style.textAlign = 'center'
		            //td1.style.width = '98px'
		            tr.appendChild(td1);

		            var td2 = document.createElement('TD')
		            td2.appendChild(document.createTextNode(content[2]));
		            td2.style.textAlign = 'center';
		            if (content[2] == doc[item].price) {
		            	td2.ondblclick = function () {
		            		bearbeiten(this, 'price')
		            	}
		            }
		            //td2.style.width = '98px'
		            tr.appendChild(td2);

		            var td3 = document.createElement('TD')
		            td3.appendChild(document.createTextNode(content[3]));
		            td3.style.textAlign = 'center';
		            if (content[3] == doc[item].variableCosts) {
		            	td3.ondblclick = function () {
		            		bearbeiten(this, 'variableCosts')
		            	}
		            }
		            //td3.style.width = '108px'
		            tr.appendChild(td3);

		            if (onclick) {
		            	tr.onclick = onclick;
		            }

		            tableBody.appendChild(tr);
			    }
			    
			    var direcCostArr = [
			    	[doc[item].name, doc[item].yield, doc[item].price, (doc[item].price * doc[item].yield).toFixed(2)],
			    	['Summe Leistung', '', '', (doc[item].price * doc[item].yield).toFixed(2)],
			    	['Summe Direktkosten', '', '', doc[item].variableCosts],
			    	['Direktkostenfreie Leistung', '', '', ((doc[item].price * doc[item].yield).toFixed(2) - doc[item].variableCosts).toFixed(2)]
			    	//['Variable Maschinenkosten', '', '', 0]
			    ]
				direcCostArr.forEach(createRows)

				// Variable machine costs

				var trMech = document.createElement('TR');
				var tdMech = document.createElement('TD')
				tdMech.colSpan = '4';
				tdMech.style.padding = '20px 0px 20px 0px';

				// Create table inside td
				var tableMech = document.createElement('TABLE')
				var tableMechHead = document.createElement('THEAD')
				var tableMechBody = document.createElement('TBODY')

				tableMech.appendChild(tableMechHead);
				tableMech.appendChild(tableMechBody);


				var kopfzeile = [];
				kopfzeile[0] = "";
				kopfzeile[1] = "Häufigkeit";
				//kopfzeile[1] = "Zeitraum"
				kopfzeile[2] = "Arbeitsvorgang";
				kopfzeile[3] = "Menge";
				kopfzeile[4] = "Arbeitszeitbedarf";
				kopfzeile[5] = "Dieselbedarf";
				kopfzeile[6] = "Kosten [EUR/ha]";
				//kopfzeile[5] = ""

				// Columns are created
				var tr = document.createElement('TR');
				tableMechHead.appendChild(tr);
				for (i = 0; i < kopfzeile.length; i++) {
				    var th = document.createElement('TH');
				    th.appendChild(document.createTextNode(kopfzeile[i]));
				    //th.classList.add('table-small');
				    // cell containing 'insert above element'
				    if (i == 0) {
				    	th.rowSpan = '2';
				    	th.style.width = '40px'
				    	th.style.padding = '0px'
				    	th.style.background = '#F5F5F5';
				    }
				    else if (i == 1) {
				    	th.colSpan = '2'
				    	//th.classList.remove('table-small');
				    	//th.classList.add('table-medium');
				    }
				    else if (i == 2) {
						th.classList.remove('table-small');
				    	th.classList.add('table-desc');
				    }
				    else if (i == 6) {
				    	th.colSpan = '7'
				    }
				    tr.appendChild(th);
				}

				var kopfzeile2 = [];
				//kopfzeile2[0] = ""
				kopfzeile2[0] = "Zeitraum"
				kopfzeile2[1] = ""
				kopfzeile2[2] = '../ha'
				kopfzeile2[3] = "[h/ha]"
				kopfzeile2[4] = "[l/ha]"
				kopfzeile2[5] = "Abschreibung"
				kopfzeile2[6] = "Zinskosten"
				kopfzeile2[7] = "Sonstiges"
				kopfzeile2[8] = "Reparaturen"
				kopfzeile2[9] = "Betriebsstoffe"
				kopfzeile2[10] = "Dienstleistungen"
				kopfzeile2[11] = "Summe"

				var tr = document.createElement('TR');
				tableMechHead.appendChild(tr);
				for (i = 0; i < kopfzeile2.length; i++) {
				    var th = document.createElement('TH');
				    th.appendChild(document.createTextNode(kopfzeile2[i]));
				    if (i == 1) {
				    	th.classList.add('table-desc');
				    }
				    else if (i > 4) {
				    	th.classList.add('table-small');
				    }
				    else {
				    	th.classList.add('table-medium');
				    }
				    if (i == 0) {
				    	th.colSpan = '2'
				    }
				    tr.appendChild(th);
				}
				// create var. machine Cost table
				var workingOperations = varMechCost({
					'tableMechBody': tableMechBody,
					'tableMech': tableMech,
					'tdMech': tdMech,
					'trMech': trMech,
					'tableBody': tableBody,
					//'tableDiv': tableDiv,
					'json': doc[item],
					'name': item
				});

				// update db values
				doc[item].operatingCosts = workingOperations[0];
				doc[item].interestCosts = workingOperations[1];

				// append table to dom
				tableDiv.appendChild(table);

			    // add Checkboxes for Subsequent crops
			    var container = document.createElement('div');
			    container.classList.toggle(item.toUpperCase());
			    var headline = document.createElement('h2');
			    	headline.innerHTML = 'FOLGEFRÜCHTE';
			    container.appendChild(headline);

			    availCrops.forEach(function (subseqCrop) {
			    	if (subseqCrop == '_id' || subseqCrop == '_rev') {
			    		return
			    	}
		    		var checkbox = document.createElement('input');
					checkbox.type = "checkbox";
					checkbox.style.display = 'inline-block';
					checkbox.value = subseqCrop;
					checkbox.id = 'subseqCrop/' + subseqCrop;
					checkbox.onclick = function () {
						if (this.checked) {
							profile.get('crops').then(function (data) {
								data[item].subseqCrops.push(subseqCrop);
								return profile.put(data);
							});
						}
						else {
							profile.get('crops').then(function (data) {
								var cropIndex = data[item].subseqCrops.indexOf(subseqCrop);
								if (cropIndex > -1) {
									data[item].subseqCrops.splice(cropIndex, 1);
									return profile.put(data);
								}
							});
						}
					};

					var label = document.createElement('label')
					label.htmlFor = 'subseqCrop/' + subseqCrop;
					label.appendChild(document.createTextNode(subseqCrop));

			    	if (doc[item].subseqCrops.indexOf(subseqCrop) > -1) {
			    		//console.log('hier')
			    		checkbox.checked = true;
			    	}

			    	container.appendChild(checkbox);
					container.appendChild(label);
					container.appendChild(document.createElement('br'));
			    });
				var subseqCropsDiv = document.getElementById('subseqCrops');
				subseqCropsDiv.appendChild(container);

				// push the following to the bottom right of the page
				var containerRight = document.createElement('div');
			    containerRight.classList.toggle(item.toUpperCase());
				// set rotational break time
				var rotBreak = document.createElement('h2');
			    	rotBreak.innerHTML = 'ANBAUPAUSE IN JAHREN: ' +  doc[item].rotBreak;
			    	rotBreak.ondblclick = function () {
			    		bearbeiten(this,'rotBreak');
			    	}
			    containerRight.appendChild(rotBreak);

			    // set max rotational share
			    var maxShare = document.createElement('h2');
			    	maxShare.innerHTML = 'MAX. ANTEIL ANBAUFLÄCHE: ' + doc[item].maxShare * 100 +'%';
			    	maxShare.ondblclick = function () {
			    		bearbeiten(this, 'maxShare');
			    	}
			    containerRight.appendChild(maxShare);
			    var subseqCropsRightDiv = document.getElementById('subseqCropsRight');
				subseqCropsRightDiv.appendChild(containerRight);

			    // create crop names in sidebar
				var cropHeadline = document.createElement('h2');
				cropHeadline.innerHTML = item.toUpperCase();

				// hide all tables except first one
				if (index == 0) {
					table.style.display = 'block';
					container.style.display = 'block';
					containerRight.style.display = 'block';
					cropHeadline.classList.toggle('clicked');
				}
				else {
					table.style.display = 'none'
					container.style.display = 'none';
					containerRight.style.display = 'none';
				}
				// handle changes in dom

				function bearbeiten(x, setting) {
				    var ursprung = x.innerHTML;
				    if (ursprung !== "<input type=\"text\">") {
				       var text = x.innerHTML;
				       x.innerHTML = "";
				       var textfeld = document.createElement("INPUT");
				       textfeld.setAttribute("type", "text");
				       textfeld.value = text;
				       x.appendChild(textfeld);
				       textfeld.focus();
				       textfeld.onkeypress = checkEnter;
				       textfeld.onblur = function() {
				           if (textfeld.value == text) {
				               x.innerHTML = text;
				           } else {
				               x.innerHTML = textfeld.value;
				               // update db
				               profile.get('crops').then(function (docs) {
				               	var number = textfeld.value.replace('%','').replace( /^\D+/g, '');
				               	//console.log(number)
				               	if (setting == 'maxShare') {
				               		docs[item][setting] = number / 100;
				               	}
				          		else {
				          			//console.log(docs[item][setting])
				          			// change value in DB
				          			docs[item][setting] = Number(number);
				          			// update value in table
				          			//updateGMTable(item);
				          			//console.log(docs[item][setting])
				          		} 
				               		return profile.put(docs).then(function () {
				               			return updateGMTable(item);
				               		});
				               })
				           }
				       };
				    }
				}

				  function checkEnter(e) {
				    e = e || window.event;
				    if (e.keyCode == '13') {
				        e.target.blur();
				        return false;
				        }
				   }
				// ------------------------------------------
				// Sidebar action
				// ------------------------------------------
				// add event handler for crop name in sidebar
				cropHeadline.onclick = function (e) {
					// toggle clicked class
					// set display of clicked crop to 'block', others to hidden
					var element = e.target;
					var cropTables = document.getElementById('tabelle').childNodes;
					//console.log(cropTables)
					//cropTables.forEach(function (tableNode) {
					for (var i = 0; i < cropTables.length; i++) {
						if (cropTables[i].classList.contains(element.innerHTML)) {
							cropTables[i].style.display = 'block';
						}
						else {
							cropTables[i].style.display = 'none';
						}
					}
					//	if (tableNode.classList.contains(element.innerHTML)) {
					//		tableNode.style.display = 'block';
					//	}
					//	else {
					//		tableNode.style.display = 'none';
					//	}
					//});
					var cropInfo = document.getElementById('subseqCrops').childNodes;
					for (var i = 0; i < cropInfo.length; i++) {
						if (cropInfo[i].classList.contains(element.innerHTML)) {
							cropInfo[i].style.display = 'block';
						}
						else {
							cropInfo[i].style.display = 'none';
						}
					}
					/*cropInfo.forEach(function (elem) {
						if (elem.classList.contains(element.innerHTML)) {
							elem.style.display = 'block';
						}
						else {
							elem.style.display = 'none';
						}
					}); */
					var cropInfo2 = document.getElementById('subseqCropsRight').childNodes;
					for (var i = 0; i < cropInfo2.length; i++) {
						if (cropInfo2[i].classList.contains(element.innerHTML)) {
							cropInfo2[i].style.display = 'block';
						}
						else {
							cropInfo2[i].style.display = 'none';
						}
					}
					/*
					cropInfo2.forEach(function (elem) {
						if (elem.classList.contains(element.innerHTML)) {
							elem.style.display = 'block';
						}
						else {
							elem.style.display = 'none';
						}
					}); */
					var cropClicked = document.getElementsByTagName('h2');
			        for (var j = 0; j < cropClicked.length; j++) {
			            if (cropClicked[j].classList.contains('clicked')) {
			                cropClicked[j].classList.remove('clicked');
			            }
			        }
			        this.classList.toggle('clicked');
				}
				var sidebar = document.getElementById('LeisteCrops')
				sidebar.appendChild(cropHeadline)
			}
		})
		return profile.put(doc).then(resolve);
		}).catch (function (err) {
			console.log(err)
		})
	});
  });
}

function updateGMTable(item) {
	profile.get('crops').then(function (docs) {
		// get Elements from DOM
		var revenueCell = document.getElementsByClassName(item.toUpperCase())[0].rows[1].cells[3];
		var sumRevenueCell = document.getElementsByClassName(item.toUpperCase())[0].rows[2].cells[3];
		var operatingCostsCell = document.getElementsByClassName(item.toUpperCase())[0].rows[5].cells[3];
		var interestCostsCell = document.getElementsByClassName(item.toUpperCase())[0].rows[document.getElementsByClassName(item.toUpperCase())[0].rows.length -3].cells[3]
		var sumVarCosts = document.getElementsByClassName(item.toUpperCase())[0].rows[document.getElementsByClassName(item.toUpperCase())[0].rows.length -2].cells[3]
		var grossMarginCell = document.getElementsByClassName(item.toUpperCase())[0].rows[document.getElementsByClassName(item.toUpperCase())[0].rows.length -1].cells[3];
		// update values accordingly
		revenueCell.innerHTML = (docs[item].price * docs[item].yield).toFixed(2);
		sumRevenueCell.innerHTML = (docs[item].price * docs[item].yield).toFixed(2);
		operatingCostsCell.innerHTML = (docs[item].operatingCosts).toFixed(2);
		interestCostsCell.innerHTML = (docs[item].interestCosts).toFixed(2);
		sumVarCosts.innerHTML = (docs[item].variableCosts + docs[item].operatingCosts + docs[item].interestCosts).toFixed(2);
		grossMarginCell.innerHTML = (docs[item].price * docs[item].yield - docs[item].variableCosts - docs[item].operatingCosts - docs[item].interestCosts).toFixed(2);
	})
}