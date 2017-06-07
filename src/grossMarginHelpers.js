//---------------------------------------------------------
// Name:      loadGrossMargins
// Purpose:   Creates array containing all crop information
//			  used in order to render the page
// 			  Consists of createCropObject and loadJSON 
// Args:      callback (function), where first arg is an
//			  array of crop objects
// Notes:     Depends on a cropList being set in
//			  Firebase DB, else returns empty array
//---------------------------------------------------------
function loadGrossMargins(callback) {
	// firebase request for crop infos
	return firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/cropsList/').once('value').then(function(cropsList) {
		var crops = cropsList.val()
		var result = [];

		firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/crops/').once('value').then(function(snapshot) {
		    if (snapshot.val()) {
		    	var cropsDB = snapshot.val()

		      	Object.keys(cropsDB).forEach(function (cropDB) {
		        	if (crops.indexOf(cropDB) > -1) {
		        		crops.splice(crops.indexOf(cropDB), 1);
		        	}
		        	result.push(cropsDB.cropDB)
		      	});
		      	return createCropObject(crops, result, callback);
		    }
		    else {
		    	return createCropObject(crops, result, callback);
		    }  
		})
	})
}

function readJsonFiles(filenames) {
  return Promise.all(filenames.map(readJSON));
}

function readJSON(path) {
  var requestPromise = new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('get', path, true);

    req.onload = function() {
      if (req.status == 200) {
        resolve(req.responseText);
      }
      else {
        reject(Error(req.statusText));
      }
    };

    req.onerror = function() {
      reject(Error("Network Error"));
    };
    req.send();
  });
    return requestPromise
}

function pushCrop (crop,values) {
	var cropPromise = new Promise(function (resolve, reject) {
		var cropObject = values.cropObject
		var recommendations = values.recommendations
		var KTBLname = values.cropToKTBL[crop]

		if (typeof KTBLname !== 'undefined') {
			var path = '../db/crops/' + cropObject[KTBLname].name.replace(',',"%2C") + '/' + cropObject[KTBLname].tillage[0].replace(',',"%2C") 
								   + '/2/' + cropObject[KTBLname].yield[0].replace(',',"%2C") + '/120/2/specification.json'
			readJsonFiles([path]).then(function (json) {
				var cropDB = {};
				var specification = JSON.parse(json[0]);
				cropDB.name = crop;
				cropDB.rotBreak = recommendations[crop].rotBreak
				cropDB.subseqCrops = function() {
					var subseqCrops = recommendations[crop].subseqCrops
					var array = [];
					subseqCrops.forEach(function (item) {
						if (crops.indexOf(item) > -1) {
							array.push(item)
						}
					})
					return array
				}
				cropDB.narrowRot = 'false'
				cropDB.rootCrop = recommendations[crop].rootCrop
				cropDB.efaFactor = recommendations[crop].efaFactor
				cropDB.quality = recommendations[crop].quality
				cropDB.maxShare = recommendations[crop].maxShare
				cropDB.leguminosae = recommendations[crop].leguminosae
				cropDB.procedures = specification.specifications

				resolve(cropDB);
			})
		}
		else {
			resolve(null)
		}
	})
		return cropPromise
}

function createCropObject (crops, result, callback) {
	if (crops) {
		var cropObjectPath = '../db/cropObject.json.gz'
		var recommendationsPath = '../db/recommendations.json.gz'
		var cropToKTBLPath = '../db/cropToKTBL.json.gz'
	 	
	 	readJsonFiles([cropObjectPath,recommendationsPath,cropToKTBLPath]).then(function (results) {
	 		var values = {}
			values.cropObject = JSON.parse(results[0])
		  	values.recommendations = JSON.parse(results[1])
		  	values.cropToKTBL = JSON.parse(results[2])

		  	Promise.all(crops.map(function (crop) {
		  		return pushCrop(crop, values)
		  	})).then(function (array) {
		  		array.forEach(function (crop) {
		  			if (crop) {
		  				result.push(crop);
		  			}
		  		})
		  		callback(result)
		  	})
		})
	}
	else {
		callback(result)
	}
}
