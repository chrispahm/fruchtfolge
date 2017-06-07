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
			var db = new PouchDB('http://v-server-node.ilb.uni-bonn.de:5984/recommendations')
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

			var promiseArr = []
			crops.forEach(function (crop) {
				return promiseArr.push(new Promise(function (resolve) {
					var KTBLname = cropToKTBL[crop]
					if (typeof KTBLname !== 'undefined') {
						console.log(crop);
						var id = cropObject[KTBLname].name.replace(',','') + '/' + cropObject[KTBLname].tillage[0].replace(',','')
									   + '/2/' + cropObject[KTBLname].yield[0].replace(',','') + '/120/2'
						var db = new PouchDB('http://v-server-node.ilb.uni-bonn.de:5984/crops')
						db.get(id).then(function (result) {
							var cropDB = {};
							var specification = result.specification

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

							profile.get('crops').then(function (cropsStored) {
								cropsStored[crop] = cropDB
								profile.put(cropsStored).then(function () {
									resolve()
								})
							}).catch(function (err) {
								if (err.name == 'not_found') {
									var cropsStored = {}
									cropsStored['_id'] = 'crops'
									cropsStored[crop] = cropDB
									profile.put(cropsStored).then(function () {
										resolve()
									})
								}
							})
						})
					}
					else {
						resolve()
					}
				})
			)
		})
		Promise.all(promiseArr).then(function () {
			resolve()
		})
	  })
	}).then(function () {
		return new Promise (function (resolve) {
			var promiseArr = []
			profile.get('crops').then(function (cropsStored) {
				Object.keys(cropsStored).forEach(function (crop) {
					if (crop == '_id' || crop == '_rev') {
						return
					}
					else {
						return promiseArr.push(new Promise (function (resolve) {
							var db = new PouchDB('http://v-server-node.ilb.uni-bonn.de:5984/sgm')
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
							else if (crop == 'Ackerbohnen' || crop == 'Erbsen'){
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
	}).then(function (){
		profile.get('crops').then(function (doc) {
			Object.keys(doc).forEach(function (item, index) {
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
				//        th.width = 'auto';
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
			            td1.style.textAlign = 'center'
			            //td1.style.width = '98px'
			            tr.appendChild(td1);

			            var td2 = document.createElement('TD')
			            td2.appendChild(document.createTextNode(content[2]));
			            td2.style.textAlign = 'center'
			            //td2.style.width = '98px'
			            tr.appendChild(td2);

			            var td3 = document.createElement('TD')
			            td3.appendChild(document.createTextNode(content[3]));
			            td3.style.textAlign = 'center'
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
					function varMechCost() {
						var trMech = document.createElement('TR');
						var tdMech = document.createElement('TD')
						tdMech.colSpan = '4'
						tdMech.style.padding = '20px'

						// Create table inside td
						var tableMech = document.createElement('TABLE')
						var tableMechHead = document.createElement('THEAD')
						var tableMechBody = document.createElement('TBODY')

						tableMech.appendChild(tableMechHead);
						tableMech.appendChild(tableMechBody);


						var kopfzeile = [];
						kopfzeile[0] = "Häufigkeit"
						//kopfzeile[1] = "Zeitraum"
						kopfzeile[1] = "Arbeitsvorgang"
						kopfzeile[2] = "Arbeitszeitbedarf"
						kopfzeile[3] = "Dieselbedarf"
						kopfzeile[4] = "Kosten [EUR/ha]"
						//kopfzeile[5] = ""

						// Columns are created
						var tr = document.createElement('TR');
						tableMechHead.appendChild(tr);
						for (i = 0; i < kopfzeile.length; i++) {
						    var th = document.createElement('TH');
						    th.appendChild(document.createTextNode(kopfzeile[i]));
						    th.classList.add('table-medium');
						    if (i == 4) {
						    	th.colSpan = '7'
						    	th.classList.remove('table-medium');
						    }
						    else if (i == 0) {
						    	th.colSpan = '2'
						    }
						    else if (i == 1) {
								th.classList.remove('table-medium');
						    	th.classList.add('table-desc');
						    }
						    tr.appendChild(th);
						}

						var kopfzeile2 = [];
						//kopfzeile2[0] = ""
						kopfzeile2[0] = "Zeitraum"
						kopfzeile2[1] = ""
						kopfzeile2[2] = "[h/ha]"
						kopfzeile2[3] = "[l/ha]"
						kopfzeile2[4] = "Abschreibung"
						kopfzeile2[5] = "Zinskosten"
						kopfzeile2[6] = "Sonstiges"
						kopfzeile2[7] = "Reparaturen"
						kopfzeile2[8] = "Betriebsstoffe"
						kopfzeile2[9] = "Dienstleistungen"
						kopfzeile2[10] = "Summe"

						var tr = document.createElement('TR');
						tableMechHead.appendChild(tr);
						for (i = 0; i < kopfzeile2.length; i++) {
						    var th = document.createElement('TH');
						    th.appendChild(document.createTextNode(kopfzeile2[i]));
						    if (i == 1) {
						    	th.classList.add('table-desc');
						    }
						    else if (i > 3) {
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
						
						var sum = {}
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

							Object.keys(procedure).forEach(function (key) {
								if (key !== 'steps') {
									var td = document.createElement('TD')
									td.appendChild(document.createTextNode(procedure[key]))
									td.style.textAlign = 'center'
									if (key !== 'name') {
										td.rowSpan = (procedure.steps.length + 1).toString()
									}
									else {
										td.style.textAlign = 'left'
									}
									trStep.appendChild(td)
								}
							})
							for (var i = 0; i < 9; i++) {
								var td = document.createElement('TD')
								trStep.appendChild(td)
							}
							trStep.style.background = backgroundColour
							tableMechBody.appendChild(trStep)

							// Cells for each working step are created
							// sums are stored in following var
							
							for (var i = 0; i < procedure.steps.length; i++) {
								var step = procedure.steps[i]
								var tr = document.createElement('TR')

								var keys = ['description', 'time', 'fuelCons', 'deprec', 'interest', 'others', 'maintenance', 'lubricants', 'services']

								keys.forEach(function (key) {
									var td = document.createElement('TD')
									td.appendChild(document.createTextNode(step[key]))
									td.style.textAlign = 'center'
									if (key == 'description') {
										td.style.textAlign = 'left'
									}
									tr.style.background = backgroundColour
									tr.appendChild(td)
								})

								var tdSum = document.createElement('TD')
								// add individual diesel price in future version
								var sumHori = (step.deprec + step.interest + step.others + step.maintenance + step.lubricants + step.services + step.fuelCons * 1).toFixed(2)
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
						var sumKeys = ['','','sum','time', 'fuelCons', 'deprec', 'interest', 'others', 'maintenance', 'lubricants', 'services', 'total']
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
						
						tdMech.appendChild(tableMech)
						trMech.appendChild(tdMech)
						tableBody.appendChild(trMech)
					}
					varMechCost();
					
					// append table to DOM
				    tableDiv.appendChild(table);
					
				    // create crop names in sidebar
					var cropHeadline = document.createElement('h2');
					cropHeadline.innerHTML = item.toUpperCase();

					// hide all tables except first one
					if (index == 0) {
						table.style.display = 'block'
						cropHeadline.classList.toggle('clicked')
					}
					else {
						table.style.display = 'none'
					}

					// add event handler for crop name in sidebar
					cropHeadline.onclick = function (e) {
						// toggle clicked class
						// set display of clicked crop to 'block', others to hidden
						var element = e.srcElement;
						var cropTables = document.getElementById('tabelle').childNodes
						cropTables.forEach(function (tableNode) {
							if (tableNode.classList.contains(element.innerHTML)) {
								tableNode.style.display = 'block'
							}
							else {
								tableNode.style.display = 'none'
							}
						})
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