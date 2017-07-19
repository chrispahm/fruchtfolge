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
	return new Promise (function (resolve, reject) {
		if (!profile) {
			reject("No user signed in")
		}
		profile.bulkGet({
			docs: [
				{id: 'cropsList'},
				{id: 'crops'}
			]
		}).then(function (doc) {
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
					resolve(crops)
				}
				else {
					resolve(null)
				}
			} else if (doc.results[0].docs[0].ok && doc.results[1].docs[0].error) {
			// If cropsList but no crops
				var crops = doc.results[0].docs[0].ok.array
				resolve(crops)
			} else if (doc.results[0].docs[0].error && doc.results[1].docs[0].ok) {
			// If no cropsList but crops
				resolve(null)
			} else if (doc.results[0].docs[0].error && doc.results[1].docs[0].error) {
			// If none
				resolve(null)
			}
		}).catch(function (err) {
			reject(err)
		})
	}).then(function (crops) {
		return new Promise (function (resolve, reject) {
			if (!crops) {
				resolve(null)
			}
			var db = new PouchDB(couchPath + '/recommendations')
			db.bulkGet({
					docs: [
						{id: 'cropObject'},
						{id: 'recommendations'},
						{id: 'cropToKTBL'}
					]
				}).then(function (doc) {
					var value = {a: doc, b: crops}
					resolve(value)
				}).catch(function (err) {
					console.log(err)
				})
		})
	}).then(function (value) {
		return new Promise (function (resolve, reject) {
			if (!value) {
				resolve(null)
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
				var db = new PouchDB(couchPath + 'crops')
				db.bulkGet(requests).then(function (docs) {
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
					profile.put(data).then(function () {
						resolve()
					})
				});						
			}

			profile.get('crops').then(function (data) {
				createCrops(data)
			}).catch(function (err) {
				if (err.name == 'not_found') {
					var cropsStored = {}
					cropsStored['_id'] = 'crops'
					createCrops(cropsStored);
				}
			});
		});
}).then(function () {
		return new Promise (function (resolve) {
			var promiseArr = []
			profile.get('crops').then(function (cropsStored) {
				// || typeof cropsStored[crop].price !== 'undefined' || typeof cropsStored[crop].yield !== 'undefined'
				Object.keys(cropsStored).forEach(function (crop) {
					if (crop == '_id' || crop == '_rev'  || cropsStored[crop].price > 0 || cropsStored[crop].yield > 0 ) {
						return
					}
					else {
						return promiseArr.push(new Promise (function (resolve) {
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
							db.get(id).then(function (result) {
								cropsStored[crop].yield = result.yield
								cropsStored[crop].price = result.price
								cropsStored[crop].variableCosts = result.variableCosts
								resolve()
							}).catch(function (err) {
								cropsStored[crop].yield = 0
								cropsStored[crop].price = 0
								cropsStored[crop].variableCosts = 0
								resolve()
							})
						}))
					}
				})
				Promise.all(promiseArr).then(function () {
					profile.put(cropsStored).then(function () {
						resolve()
					})
				})
		})
	  })
	}).then(function () {
		return new Promise(function (resolve, reject) {
			var db = new PouchDB(couchPath + '/recommendations');
			db.get('machCombiObject').then(function (doc) {
				machCombiObject = doc;
				resolve()
			})
		})
	}).then(function () {
		profile.get('crops').then(function (doc) {
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
					var sum = {}
					function varMechCost() {
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
						
						//var sum = {}
						sum.time = 0
						sum.fuelCons = 0
						sum.deprec = 0
						sum.interest = 0
						sum.others = 0
						sum.maintenance = 0
						sum.lubricants = 0
						sum.services = 0
						sum.total = 0

						doc[item].procedures.forEach(function (procedure, index) {
							var trStep = document.createElement('TR');
							trStep.classList.toggle(item + ';' + index.toString())
							trStep.setAttribute("name", procedure.group + ';' + procedure.procedure + ';' + procedure.combination);
							//trStep.onclick = replaceProcedure;
							//var tdStep = document.createElement('TD')
							//tdStep.colSpan = '4'
							function isEven(n) {
							   return n % 2 == 0;
							}

							if (isEven(index)) {
								var backgroundColour = '#ECECEC'
							}
							else {
								var backgroundColour = '#F5F5F5'
							}

							// table cell for 'include before' button
							var tdBefore = document.createElement('TD');
							tdBefore.style.background = '#F5F5F5';
							tdBefore.innerHTML = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"width="64px" height="64px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve"> <g> <g> <g id="circle_copy_4"> <g> <path d="M32,0C14.327,0,0,14.327,0,32s14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M32,62.001C15.432,62.001,2,48.568,2,32 C2,15.432,15.432,2,32,2c16.568,0,30,13.432,30,30C62,48.568,48.568,62.001,32,62.001z" fill="grey"/> </g> </g> <g id="Menu_1_"> <g> <polygon points="44,31 33,31 33,20 31,20 31,31 20,31 20,33 31,33 31,44 33,44 33,33 44,33 				" fill="grey"/> </g> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>';
							tdBefore.children[0].classList.toggle('insertBefore');
							tdBefore.children[0].onclick = function () {
								replaceProcedure(tdBefore.children[0]);
							};
							tdBefore.classList.toggle('insertBeforeButton');
							tdBefore.rowSpan = (procedure.steps.length + 1).toString();
							trStep.appendChild(tdBefore);

							// create cells for frequency, month and amount
							Object.keys(procedure).forEach(function (key) {
								if (key !== 'steps' && key !== 'group' && key !== 'procedure' && key !== 'combination') {
									var td = document.createElement('TD');
									if (key == 'amount') {
										if (procedure.amount !== '') {
											td.appendChild(document.createTextNode(procedure.amount[0] + ' ' + procedure.amount[1]))
										}
									}
									else if (key == 'month'){
										var select = document.createElement('select');
										var options = ['JAN1','JAN2','FEB1','FEB2','MRZ1','MRZ2','APR1','APR2','MAI1','MAI2','JUN1','JUN2','JUL1','JUL2','AUG1','AUG2','SEP1','SEP2','OKT1','OKT2','NOV1','NOV2','DEZ1','DEZ2']
										options.forEach(function (month) {
											var option = document.createElement('option');
											option.innerHTML = month;
											option.value = month;
											if (procedure.month == month) {
												option.selected = 'selected';
											}
											select.appendChild(option);
										});
										select.classList.toggle('monthDropDown');
										select.style.background = backgroundColour;
										td.appendChild(select);
									}
									else {
										td.appendChild(document.createTextNode(procedure[key]));
									}
									td.style.textAlign = 'center'
									if (key !== 'name') {
										td.rowSpan = (procedure.steps.length + 1).toString();
									}
									else {
										td.style.textAlign = 'left';
										td.onclick = function () {
											replaceProcedure(td);
										};
									}
									trStep.appendChild(td);
								}
							})
							for (var i = 0; i < 10; i++) {
								var td = document.createElement('TD');
								// table cell containing delete button
								if (i == 9) {
									//td.innerHTML = '<svg viewPort="0 0 12 12" version="1.1"xmlns="http://www.w3.org/2000/svg"> <line x1="1" y1="11"x2="11" y2="1"stroke="grey"stroke-width="1"/> <line x1="1" y1="1"x2="11" y2="11"stroke="grey"stroke-width="1"/> </svg>';
									td.innerHTML = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"width="64px" height="64px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve"> <g> <g> <g id="circle_63_"> <g> <path d="M32,0C14.327,0,0,14.327,0,32s14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M32,62C15.432,62,2,48.568,2,32 C2,15.432,15.432,2,32,2c16.568,0,30,13.432,30,30C62,48.568,48.568,62,32,62z" fill="grey"/> </g> </g> <g id="Rectangle_2_copy"> <g> <path d="M37,24v-2c0-1.104-0.896-2-2-2h-6c-1.104,0-2,0.896-2,2v2h-5v2h2v16c0,1.104,0.896,2,2,2h12c1.104,0,2-0.896,2-2V26h2 v-2H37z M29,22h6v2h-6V22z M38,42H26V26h12V42z M31,28h-2v12h2V28z M35,28h-2v12h2V28z" fill="grey"/> </g> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>';
									td.children[0].classList.toggle('deleteHover')
									td.children[0].onclick = function () {
										deleteProcedure(td);
									};
									td.classList.toggle('deleteButton');
									td.rowSpan = (procedure.steps.length + 1).toString();
								}
								trStep.appendChild(td);
							}

							trStep.style.background = backgroundColour;
							tableMechBody.appendChild(trStep);

							// Cells for each working step are created
							// sums are stored in following var
							
							for (var i = 0; i < procedure.steps.length; i++) {
								var step = procedure.steps[i];
								var tr = document.createElement('TR');
								tr.classList.toggle(item + ';' + index.toString());
								tr.setAttribute("name", procedure.group + ';' + procedure.procedure + ';' + procedure.combination);
							
								var keys = ['description','time', 'fuelCons', 'deprec', 'interest', 'others', 'maintenance', 'lubricants', 'services'];

								keys.forEach(function (key) {
									var td = document.createElement('TD')
									td.appendChild(document.createTextNode(step[key]))
									td.style.textAlign = 'center'
									if (key == 'description') {
										td.style.textAlign = 'left';
										td.onclick = function () {
											replaceProcedure(td);
										};
									}
									tr.style.background = backgroundColour;
									tr.appendChild(td);
								})

								var tdSum = document.createElement('TD');
								// add individual diesel price in future version
								// step.deprec + step.interest step.others + + step.fuelCons * 0.7)
								var sumHori = (step.maintenance + step.lubricants + step.services).toFixed(2)
								tdSum.appendChild(document.createTextNode(sumHori))
								tdSum.style.textAlign = 'center'
								tr.appendChild(tdSum)

								tableMechBody.appendChild(tr)

								sum.time += step.time
								sum.fuelCons += step.fuelCons
								sum.deprec += step.deprec
								sum.interest += step.interest
								sum.others += step.others
								sum.maintenance += step.maintenance
								sum.lubricants += step.lubricants
								sum.services += step.services
								sum.total += Number(sumHori)
							}
							
							//trStep.appendChild(tdStep)
							//tableMechBody.appendChild(trStep)
						})
						var sumKeys = ['','','','','sum','time', 'fuelCons', 'deprec', 'interest', 'others', 'maintenance', 'lubricants', 'services', 'total']
						var trSum = document.createElement('TR')
						sumKeys.forEach(function (key) {
							var tdSum = document.createElement('TD')
							if (key == 'sum') {
								tdSum.appendChild(document.createTextNode('Summe'))
								tdSum.style.textAlign = 'right'
							}
							else if (key !== '') {
								tdSum.appendChild(document.createTextNode((sum[key]).toFixed(2)))
							}
							tdSum.style.textAlign = 'center'
							trSum.appendChild(tdSum)
						})
						tableMechBody.appendChild(trSum)

						// show/hide variable machine cost row on click
						createRows(['Variable Maschinenkosten', '', '', sum.total.toFixed(2)], function (e) {
							    e.__toggle = !e.__toggle;
						        var target = e.srcElement.parentElement.nextSibling;

						        if( target.classList.contains('hide')) {
						            target.classList.remove('hide');
						        }
						        else {
						            target.classList.toggle('hide');
						        }
						    }
						)
						
						tdMech.appendChild(tableMech);
						trMech.appendChild(tdMech);
						trMech.classList.toggle('hide');
						tableBody.appendChild(trMech);
					}
					varMechCost();
					
					// add row for total variable costs
					// add interest costs
					createRows(['Zinskosten (3 Monate)','','', (Number(sum.total.toFixed(2)) / 12 * 3 * 0.03).toFixed(2)]);
					createRows(['Summe variable Kosten','','', (Number(doc[item].variableCosts) + Number(sum.total.toFixed(2)) + Number(sum.total.toFixed(2)) / 12 * 3 * 0.03 ).toFixed(2)]);
					// add row for gross margin
					createRows(['Deckungsbeitrag','','', ((Number(doc[item].price) * Number(doc[item].yield)).toFixed(2) - (Number(doc[item].variableCosts) + Number(sum.total.toFixed(2)) + Number(sum.total.toFixed(2)) / 12 * 3 * 0.03)).toFixed(2)])

					// append table to DOM
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
						//checkbox.checked = true;

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

					// set rotational break time
					var rotBreak = document.createElement('h2');
				    	rotBreak.innerHTML = 'ANBAUPAUSE IN JAHREN: ' +  doc[item].rotBreak;
				    	rotBreak.ondblclick = function () {
				    		bearbeiten(this,'rotBreak');
				    	}
				    container.appendChild(rotBreak);

				    // set max rotational share
				    var maxShare = document.createElement('h2');
				    	maxShare.innerHTML = 'MAX. ANTEIL ANBAUFLÄCHE: ' + doc[item].maxShare * 100 +'%';
				    	maxShare.ondblclick = function () {
				    		bearbeiten(this, 'maxShare');
				    	}
				    container.appendChild(maxShare);

				    // create crop names in sidebar
					var cropHeadline = document.createElement('h2');
					cropHeadline.innerHTML = item.toUpperCase();

					// hide all tables except first one
					if (index == 0) {
						table.style.display = 'block';
						container.style.display = 'block';
						cropHeadline.classList.toggle('clicked');
					}
					else {
						table.style.display = 'none'
						container.style.display = 'none';
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
					               	console.log(number)
					               	if (setting == 'maxShare') {
					               		docs[item][setting] = number / 100;
					               	}
					          		else {
					          			console.log(docs[item][setting])
					          			docs[item][setting] = Number(number);
					          			console.log(docs[item][setting])
					          		} 
					               		return profile.put(docs);
					               })
					           }
					       };
					    }
					}

					  function checkEnter(e) {
					    e = e || window.event;
					    if (e.keyCode == '13') {
					        e.srcElement.blur();
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
						var element = e.srcElement;
						var cropTables = document.getElementById('tabelle').childNodes;
						//console.log(cropTables)
						cropTables.forEach(function (tableNode) {
							if (tableNode.classList.contains(element.innerHTML)) {
								tableNode.style.display = 'block';
							}
							else {
								tableNode.style.display = 'none';
							}
						});
						var cropInfo = document.getElementById('subseqCrops').childNodes;
						cropInfo.forEach(function (elem) {
							if (elem.classList.contains(element.innerHTML)) {
								elem.style.display = 'block';
							}
							else {
								elem.style.display = 'none';
							}
						});
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
		}).catch (function (err) {
			console.log(err)
		})
	})
}