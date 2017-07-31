function varMechCost(data) {
	// strip info from data object
	var tableMechBody = data.tableMechBody,
		tableMech = data.tableMech,
		tdMech = data.tdMech,
		trMech = data.trMech,
		tableBody = data.tableBody,
		//tableDiv = data.tableDiv,
		json = data.json,
		item = data.name;

	// sum object is filled in loop below
	var sum = {
		time: 0,
		fuelCons: 0,
		deprec: 0,
		interest: 0,
		others: 0,
		maintenance: 0,
		lubricants: 0,
		services: 0,
		total: 0
	}

	json.procedures.forEach(function (procedure, index) {
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
	        var target = e.target.parentElement.nextSibling;

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

	// add row for total variable costs
	// add interest costs
	createRows(['Zinskosten (3 Monate)','','', (Number(sum.total.toFixed(2)) / 12 * 3 * 0.03).toFixed(2)]);
	createRows(['Summe variable Kosten','','', (Number(json.variableCosts) + Number(sum.total.toFixed(2)) + Number(sum.total.toFixed(2)) / 12 * 3 * 0.03 ).toFixed(2)]);
	// add row for gross margin
	createRows(['Deckungsbeitrag','','', ((Number(json.price) * Number(json.yield)).toFixed(2) - (Number(json.variableCosts) + Number(sum.total.toFixed(2)) + Number(sum.total.toFixed(2)) / 12 * 3 * 0.03)).toFixed(2)])

	// append table to DOM
    //tableDiv.appendChild(table);

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
        if (content[1] == json.yield) {
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
        if (content[2] == json.price) {
        	td2.ondblclick = function () {
        		bearbeiten(this, 'price')
        	}
        }
        //td2.style.width = '98px'
        tr.appendChild(td2);

        var td3 = document.createElement('TD')
        td3.appendChild(document.createTextNode(content[3]));
        td3.style.textAlign = 'center';
        if (content[3] == json.variableCosts) {
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
}