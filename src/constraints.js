function constraints() {
	return new Promise (function (resolve, reject) {
		profile.bulkGet({
			docs: [
				{id: 'crops'},
				{id: 'fields'},
				{id: 'constraints'},
			]
		}).then(function (result) {
			var crops = result.results[0].docs[0].ok;
			var fields = result.results[1].docs[0].ok;
			var table = document.getElementById('tableConst');

			// get total crop area
			var totArea = 0;
			Object.keys(fields).forEach(function (plot) {
				if (fields[plot].size) {
					totArea += fields[plot].size;
				}
			})

			// add functionality to add crop icon
			document.getElementById('addCrop').addEventListener('click', addCrop);

			// add functionality to cancel button
			document.getElementById('buttonConstCancel').addEventListener('click', function () {
				document.getElementById('blur-const').className = 'hide';
				document.getElementById('addConstraint').className = 'hide';
			});

			// add functionality to ok button
			document.getElementById('buttonConstOk').addEventListener('click', function () {
				document.getElementById('blur-const').className = 'hide';
				document.getElementById('addConstraint').className = 'hide';

				profile.get('constraints').then(function (res) {
					var selects = document.getElementById('constraintInputs').getElementsByTagName('select');
					var cropsArr = [];
					for (var i = 0; i < selects.length -1; i++) {
						cropsArr.push(selects[i].value);
					}

					var type = (function () {
						if (selects[selects.length - 1].value == 'maximal') return 'max'
						else return 'min';
					})();
					var ha = Number(document.getElementById('constraint.amount').value);

					createConst(cropsArr, type, ha);
					res.array.push([cropsArr,type,ha]);
					return profile.put(res);
				})
			});

			// if no constraints yet
			if (!result.results[2].docs[0].ok) {
				var constraints = {
					'_id': 'constraints',
					'array': []
				};

				var table = document.getElementById('tableConst');
				Object.keys(crops).forEach(function (crop, index) {
					if (crop == '_id' || crop == '_rev') return
					constraints.array.push([[crop],'max', crops[crop].maxShare * totArea, index]);
					createConst([crop],'max', crops[crop].maxShare * totArea, index);
				});
				var tr = document.createElement('tr');
				var td = document.createElement('td');
				td.innerHTML = '<button type="button" id="const-btn" class="invekosBtn" name="const-btn">HINZUFÜGEN</button>';
				td.onclick = showConstBox;
				tr.appendChild(td);
				table.appendChild(tr);

				return profile.put(constraints).then(function () {
					resolve();
				});
			}
			// if constraints already present
			else {
				var constraints = result.results[2].docs[0].ok;
				constraints.array.forEach(function (constraint) {
					createConst(constraint[0], constraint[1], constraint[2], constraint[3]);
				});
				var tr = document.createElement('tr');
				var td = document.createElement('td');
				td.innerHTML = '<button type="button" id="const-btn" class="invekosBtn" name="const-btn">HINZUFÜGEN</button>';
				td.onclick = showConstBox;
				tr.appendChild(td);
				td.style.backgroundColor = '#F5F5F5';
				table.appendChild(tr);

				return resolve();
			}


			function showConstBox() {
				document.getElementById('blur-const').className = '';
				document.getElementById('addConstraint').className = '';

				var select = document.getElementById('constraint.crop');

				Object.keys(crops).forEach(function (crop) {
					if (crop == '_rev' || crop == "_id") return
					var option = document.createElement('option');
					option.innerHTML = crop;
					select.appendChild(option);
				})
			}

			function addCrop (x) {
				x.stopPropagation();
				var src = x.target;
			  	var parent = x.target.parentNode;
			  	var select = document.createElement('select');
			  	// create options
			  	Object.keys(crops).forEach(function (crop) {
			  		if (crop == '_rev' || crop == "_id") return
					var option = document.createElement('option');
					option.innerHTML = crop;
					select.appendChild(option);
				})

			  	select.className = 'replacementDropDown';
			  	return parent.insertBefore(select, src);
			};


			function createConst (cropsArr, type, ha, pos) {
				var tr = document.createElement('tr');
				var td1 = document.createElement('td');

				var cropsString = '';
				cropsArr.forEach(function (crop, index) {
					cropsString += crop;
					if (index < cropsArr.length -1) {
						cropsString += ' + ';
					}
				});

				if (type == 'max') {
					cropsString += ' maximal ' + ha.toFixed(1) + ' ha';
				} 
				else {
					cropsString += ' mindestens ' + ha.toFixed(1) + ' ha';
				}
				td1.style.width = '240px';
				td1.appendChild(document.createTextNode(cropsString));

				var td2 = document.createElement('td');
				td2.innerHTML = '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"width="64px" height="64px" viewBox="0 0 64 64" style="enable-background:new 0 0 64 64;" xml:space="preserve"> <g> <g> <g id="circle_63_"> <g> <path d="M32,0C14.327,0,0,14.327,0,32s14.327,32,32,32s32-14.327,32-32S49.673,0,32,0z M32,62C15.432,62,2,48.568,2,32 C2,15.432,15.432,2,32,2c16.568,0,30,13.432,30,30C62,48.568,48.568,62,32,62z" fill="grey"/> </g> </g> <g id="Rectangle_2_copy"> <g> <path d="M37,24v-2c0-1.104-0.896-2-2-2h-6c-1.104,0-2,0.896-2,2v2h-5v2h2v16c0,1.104,0.896,2,2,2h12c1.104,0,2-0.896,2-2V26h2 v-2H37z M29,22h6v2h-6V22z M38,42H26V26h12V42z M31,28h-2v12h2V28z M35,28h-2v12h2V28z" fill="grey"/> </g> </g> </g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> <g> </g> </svg>';
				td2.children[0].classList.toggle('deleteHover')
				td2.children[0].onclick = function () {
					//console.log(this.parentNode.parentNode.rowIndex)
					deleteConst(this.parentNode.parentNode.rowIndex);
				};
				td2.classList.toggle('deleteButton');

				tr.appendChild(td1);
				tr.appendChild(td2);

				table.appendChild(tr);
			}

			function deleteConst(index) {
				table.deleteRow(index);
				profile.get('constraints').then(function (res) {
					res.array.splice(index, 1);
					console.log(res);
					return profile.put(res);
				}); 
			}


		})
	});
}