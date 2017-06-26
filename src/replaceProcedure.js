function replaceProcedure (e) {
	var trClass = e.parentElement.classList.value;
	if (trClass !== 'insertBeforeButton') {
		var cropName = trClass.split(';')[0];
		var procedureIndex = Number(trClass.split(';')[1]);
		var srcTable = e.parentElement.parentElement;
		var trList = document.getElementsByClassName(trClass);
		var trArray = [];
		for (var i = 0; i < trList.length; i++) {
			trArray.push(trList[i]);
		}
		var index = trArray[0].rowIndex - 2;
		var groupId = trList[0].getAttribute('name').split(';')[0];
		var procedureId = trList[0].getAttribute('name').split(';')[1];
		var combinationId = trList[0].getAttribute('name').split(';')[2];
		// if procedure contains of more than 1 step, the combination names are combined
		// in order to be found accordingly
		var groupName, procedureName, combinationName, amountName, workingWidthName;
		if (trArray[0].children[4].innerHTML !== '') {
			amountName = trArray[0].children[4].innerHTML.split(' ')[0];
		}
	}
	else {
		var srcTable = e.parentElement.parentElement.parentElement;
		var trClassTable = e.parentElement.parentElement.classList.value;
		var cropName = trClassTable.split(';')[0];
		var procedureIndex = Number(trClassTable.split(';')[1]);
		var trList = document.getElementsByClassName(trClassTable);
		var trArray = [];
		for (var i = 0; i < trList.length; i++) {
			trArray.push(trList[i]);
		}
		var index = trArray[0].rowIndex - 2;
	}


	function createOptions (item, elem) {
		var option = document.createElement('option');
		option.innerHTML = item;
		option.value = item;
		if (item == groupName || item == procedureName || item == combinationName || item == amountName.slice(0, -1)) {
			option.selected = 'selected';
		}
		elem.appendChild(option);
	}

	//-----------------------------------------------------------------
	//	C R E A T E  I N I T I A L   S T A T E
	//-----------------------------------------------------------------
	// match preselected values with replaced procedure
	if (trClass !== 'insertBeforeButton') {
		Object.keys(machCombiObject).forEach(function (group) {
			if (group == '_id' && group == 'rev') {
				return
			}
			if (machCombiObject[group].id == groupId) {
				groupName = group;
				Object.keys(machCombiObject[group]).forEach(function (procedure) {
					if (machCombiObject[group][procedure].id == procedureId) {
						procedureName = procedure;
						Object.keys(machCombiObject[group][procedure]).forEach(function (combi) {
							if (machCombiObject[group][procedure][combi].id == combinationId) {
								combinationName = combi;
								if (typeof amountName == 'undefined') {
									amountName = machCombiObject[group][procedureName][combinationName].amount[0];
								}
								workingWidthName = machCombiObject[group][procedureName][combinationName].workingWidth[0];
							}
						})
					}
				})
			}
		});
	}
	if (typeof groupName == 'undefined') {
		var groupName = 'Bodenbearbeitung';
		var procedureName = 'Eggen mit Kreiselegge';
		var combinationName = '2 m; 30 kW';
		var amountName = '0.0'
		var workingWidthName = '1.8'
	}
	// populate dropdown menus
	var group = document.getElementById('procedure.group');
	group.innerHTML = '';
	Object.keys(machCombiObject).forEach(function (item) {
		if (item == 'id' || item == '_id' || item == '_rev') {
			return
		}
		createOptions(item, group);
	});

	var procedure = document.getElementById('procedure.procedure');
	procedure.innerHTML = '';
	Object.keys(machCombiObject[groupName]).forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, procedure);
	});

	var combination = document.getElementById('procedure.combination');
	combination.innerHTML = '';
	Object.keys(machCombiObject[groupName][procedureName]).forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, combination);
	});

	var amount = document.getElementById('procedure.amount');
	amount.innerHTML = '';
	machCombiObject[groupName][procedureName][combinationName].amount.forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, amount);
	});

	var workingWidth = document.getElementById('procedure.workingWidth');
	workingWidth.innerHTML = '';
	machCombiObject[groupName][procedureName][combinationName].workingWidth.forEach(function (item) {
		if (item == 'id') {
			return
		}
		createOptions(item, workingWidth);
	});

	// show replacement box popup window
	var box = document.getElementById('replacementBox');
	var blur = document.getElementById('blur');
	box.classList.remove('hide');
	blur.classList.remove('hide');

	//-----------------------------------------------------------------
	// E V E N T S
	//-----------------------------------------------------------------
	// handle change events
	group.onchange = function () {
		var group = document.getElementById('procedure.group').value;
		var procedure = document.getElementById('procedure.procedure');
		// delete current procedure options
		procedure.innerHTML = '';
		// populate procedures dropdown with new options
		Object.keys(machCombiObject[group]).forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, procedure);
		});
		// delete combination, amount, working width options
		document.getElementById('procedure.combination').innerHTML = '';
		document.getElementById('procedure.amount').innerHTML = '';
		document.getElementById('procedure.workingWidth').innerHTML = '';

		Object.keys(machCombiObject[group][Object.keys(machCombiObject[group])[1]]).forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, combination);
		});

		machCombiObject[group][Object.keys(machCombiObject[group])[1]][Object.keys(machCombiObject[group][Object.keys(machCombiObject[group])[1]])[1]].amount.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, amount);
		});
		machCombiObject[group][Object.keys(machCombiObject[group])[1]][Object.keys(machCombiObject[group][Object.keys(machCombiObject[group])[1]])[1]].workingWidth.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, workingWidth);
		});
	};

	procedure.onchange = function () {
		var group = document.getElementById('procedure.group').value;
		var procedure = document.getElementById('procedure.procedure').value;
		var combination = document.getElementById('procedure.combination');
		// delete current procedure options
		combination.innerHTML = '';
		// populate combinations dropdown with new options
		var combinationsArr = Object.keys(machCombiObject[group][procedure]);
		combinationsArr.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, combination);
		});
		// delete amount, working width options
		document.getElementById('procedure.amount').innerHTML = '';
		document.getElementById('procedure.workingWidth').innerHTML = '';
		//if (combinationsArr.length == 2) {
		machCombiObject[group][procedure][combinationsArr[1]].amount.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, amount);
		});
		machCombiObject[group][procedure][combinationsArr[1]].workingWidth.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, workingWidth);
		});
		//}
	};

	combination.onchange = function () {
		var group = document.getElementById('procedure.group').value;
		var procedure = document.getElementById('procedure.procedure').value;
		var combination = document.getElementById('procedure.combination').value;
		var amount = document.getElementById('procedure.amount');
		var workingWidth = document.getElementById('procedure.workingWidth');
		// delete exisiting amounts and working widths
		amount.innerHTML = '';
		workingWidth.innerHTML = '';
		// populate amount and working widht with new values
		machCombiObject[group][procedure][combination].amount.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, amount);
		});
		machCombiObject[group][procedure][combination].workingWidth.forEach(function (item) {
			if (item == 'id') {
				return
			}
			createOptions(item, workingWidth);
		});
	};

	// handle accept button
	var acceptButton = document.getElementById('buttonOk');
	acceptButton.onclick = function () {
		// get id to fetch from db
		// generate group, prcedure and combination ids from selection
		ids = {
				'group': machCombiObject[group.value].id,
				'procedure': machCombiObject[group.value][procedure.value].id,
				'combination': machCombiObject[group.value][procedure.value][combination.value].id
		}
		var id = ids.group + '/' + ids.procedure + '/' + ids.combination + '/2/' + machCombiObject[group.value][procedure.value][combination.value].resistance[0] + '/2/' + amount.value + '/' + workingWidth.value;
		var db = new PouchDB(couchPath + '/procedures');
		profile.get('crops').then(function (crops) {
			db.get(id).then(function (procedure) {
				// create new entry
				var trStep = document.createElement('TR');
				if (trClass !== 'insertBeforeButton') {
					trStep.classList.toggle(trClass);
				}
				else {
					var classAlt =  e.parentElement.parentElement.classList.value;
					trStep.classList.toggle(classAlt);
				}
				
				trStep.setAttribute("name", ids.group + ';' + ids.procedure + ';' + ids.combination);

				if (trClass !== 'insertBeforeButton') {
					var backgroundColour = trArray[0].style.background;
				}
				else {
					if (trArray[0].children[1].style.background == '#ECECEC') {
						var backgroundColour = '#F5F5F5';
					}
					else {
						var backgroundColour = '#ECECEC';
					}
				}

				var rowLength = 1;
				for (var i = 0; i < procedure.steps.length; i++) {
					if (procedure.steps[i].description !== 'Summe') {
						rowLength++;
					}
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

				// Frequency
				var td1 = document.createElement('TD');
				td1.style.textAlign = 'center';
				td1.rowSpan = (rowLength).toString();
				// if replacement
				td1.appendChild(document.createTextNode(trArray[0].children[1].innerHTML));
				// else (if new entry) frequency = 1
				trStep.appendChild(td1);

				// Month
				var td2 = document.createElement('TD');
				td2.style.textAlign = 'center';
				td2.rowSpan = (rowLength).toString();
				td2.appendChild(trArray[0].children[2].children[0].cloneNode(true));
				// if replacement use old value for month, else don't specify
				td2.children[0].value = trArray[0].children[2].children[0].value;
				td2.children[0].style.background = backgroundColour;
				trStep.appendChild(td2);

				// Name
				var td3 = document.createElement('TD');
				td3.style.textAlign = 'left';
				td3.appendChild(document.createTextNode(procedure.name));
				td3.onclick = replaceProcedure;
				trStep.appendChild(td3);

				// Amount
				var td4 = document.createElement('TD');
				td4.style.textAlign = 'center';
				td4.appendChild(document.createTextNode(procedure.amount));
				td4.rowSpan = (rowLength).toString();
				trStep.appendChild(td4);

				for (var i = 0; i < 10; i++) {
					var td = document.createElement('TD');
					// table cell containing delete button
					if (i == 9) {
						td.innerHTML = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"width="64px" height="64px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve"> <g> <g> <g id="circle_63_"> <g> <path d="M32,0C14.327,0,0,14.327,0,32s14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M32,62C15.432,62,2,48.568,2,32 C2,15.432,15.432,2,32,2c16.568,0,30,13.432,30,30C62,48.568,48.568,62,32,62z" fill="grey"/> </g> </g> <g id="Rectangle_2_copy"> <g> <path d="M37,24v-2c0-1.104-0.896-2-2-2h-6c-1.104,0-2,0.896-2,2v2h-5v2h2v16c0,1.104,0.896,2,2,2h12c1.104,0,2-0.896,2-2V26h2 v-2H37z M29,22h6v2h-6V22z M38,42H26V26h12V42z M31,28h-2v12h2V28z M35,28h-2v12h2V28z" fill="grey"/> </g> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>';
						td.children[0].classList.toggle('deleteHover')
						td.children[0].onclick = function () {
							deleteProcedure(td);
						};
						td.classList.toggle('deleteButton');
						td.rowSpan = (rowLength).toString();
					}
					trStep.appendChild(td);
				}

				trStep.style.background = backgroundColour;
				srcTable.insertBefore(trStep, srcTable.children[index]);

				// Cells for each working step are created
				// sums are stored in following var
				var stepCount = 1;
				for (var i = 0; i < procedure.steps.length; i++) {
					var step = procedure.steps[i];
					if (step.description == "Summe") {
						continue;
					}
					var tr = document.createElement('TR');
					tr.classList.toggle(trClass);
					tr.setAttribute("name", ids.group + ';' + ids.procedure + ';' + ids.combination);
					//tr.onclick = replaceProcedure;

					var keys = ['description','time', 'fuelCons', 'deprec', 'interest', 'others', 'maintenance', 'lubricants', 'services'];
					if (typeof step.services == 'undefined') {
						step.services = 0;
					}
					keys.forEach(function (key) {
						var td = document.createElement('TD');
						td.appendChild(document.createTextNode(step[key]));
						td.style.textAlign = 'center';
						if (key == 'description') {
							td.style.textAlign = 'left';
							td.onclick = function () {
								replaceProcedure(td);
							};
						}
						tr.style.background = backgroundColour;
						tr.appendChild(td);
					});

					var tdSum = document.createElement('TD');
					// add individual diesel price in future version
					var sumHori = (step.deprec + step.interest + step.others + step.maintenance + step.lubricants + step.services + step.fuelCons * 1).toFixed(2);
					tdSum.appendChild(document.createTextNode(sumHori));
					tdSum.style.textAlign = 'center';
					tr.appendChild(tdSum);
					srcTable.insertBefore(tr, srcTable.children[index + stepCount]);
					stepCount++;
				}

				// save changes in DB
				var entry = {
					// old value or 1
				      "frequency": Number(trArray[0].children[1].innerHTML),
				      "month": td2.children[0].value,
				      "name": procedure.name,
				      "amount": amount.value,
				      "steps": [],
				      "group": Number(ids.group),
				      "procedure": Number(ids.procedure),
				      "combination": Number(ids.combination)
				};

				procedure.steps.forEach(function (step) {
					entry.steps.push({
				          "abr": "",
				          "description": step.description,
				          "time": step.time,
				          "fuelCons": step.fuelCons,
				          "deprec": step.deprec,
				          "interest": step.interest,
				          "others": step.others,
				          "maintenance": step.maintenance,
				          "lubricants": step.lubricants,
				          "services": 0
				        });
				})

				// replace procedure in profile information
				if (trClass !== 'insertBeforeButton') {
					crops[cropName].procedures.splice(procedureIndex, 1, entry);
				}
				// in case of insert before, don't delete previous entry
				else {
					crops[cropName].procedures.splice(procedureIndex, 0, entry);
				}

				if (trClass !== 'insertBeforeButton') {
					// delete previous entry if regular replacement
					for (var i = 0; i < trArray.length; i++) {
						srcTable.removeChild(trArray[i])
					}
				}

				// hide box
				box.classList.toggle('hide');
				blur.classList.toggle('hide');

				// post changes to db
				return profile.put(crops);
			});
		})
		
	};

	// handle cancel button
	var cancelButton = document.getElementById('buttonCancel');
	cancelButton.onclick = function () {
		box.classList.toggle('hide');
		blur.classList.toggle('hide');
	};
}