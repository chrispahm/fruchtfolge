function plotData (callback) {
	profile.bulkGet({
		docs: [
			{id: 'fields'},
			{id: 'info'}
		]
	}).then(function (doc) {
		var fieldsObject = doc.results[0].docs[0].ok;
		var fields = Object.keys(doc.results[0].docs[0].ok);
		var info = doc.results[1].docs[0].ok;

		Promise.all(fields.map(function (field) {
			return requestsPlot(field, info);
		})).then(function () {
			 return profile.put(fieldsObject).then(function (response) {
				return callback();
			}).catch(function (err) {
			  console.log(err);
			});
		});
	
		function requestsPlot(plot, info) {
			var plotObject = fieldsObject[plot]
			if ((plotObject.quality && plotObject.soilType && plotObject.distance) || !plotObject.polygon) return
			const sqr = get(createSQRurl(plotObject.polygon))
			.then(sqrHtmlParsing);

			const soilType = get(createSoilTypeUrl(plotObject.polygon))
			.then(soilTypeHtmlParsing);

			const start = turf.centerOfMass(plotObject.polygon).geometry.coordinates;
			const end = info.homeCoords;
			const distance = get('http://router.project-osrm.org/route/v1/driving/' + start + ';' + end + '?overview=false')
			.then(JSON.parse);

			return Promise.all([sqr, soilType, distance])
			.then(([parsedSqr, parsedSoilType, parsedDistance]) => 
			  Object.assign(plotObject, {
			    quality: parsedSqr,
			    soilType: parsedSoilType,
			    distance: parsedDistance.code == 'Ok'
			      ? parsedDistance.routes[0].distance / 1000
			      : ''
			  }))
			}
	});
}