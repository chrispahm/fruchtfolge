function plotData () {
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
			requestsPlot(field, info);
		})).then(function () {
			console.log(fieldsObject)
		});
	
		function requestsPlot(plot, info) {
			return new Promise (function (resolve2, reject2) {
				var plotObject = fieldsObject[plot]
				var sqr = new Promise (function (resolve, reject) {
					get(createSQRurl(plotObject.polygon))
					.then(function (result) {
						plotObject.quality = sqrHtmlParsing(result);
						resolve();
					});
				});
				var soilType = new Promise (function (resolve, reject) {
					get(createSoilTypeUrl(plotObject.polygon))
					.then(function (result) {
						plotObject.soilType = soilTypeHtmlParsing(result);
						resolve();
					});
				});
				var distance = new Promise (function (resolve, reject) {
					var start = turf.centerOfMass(plotObject.polygon).geometry.coordinates;
					var end = info.homeCoords;
					get('http://router.project-osrm.org/route/v1/driving/' + start + ';' + end + '?overview=false')
					.then(function (result) {
						var parsed = JSON.parse(result);
						if (parsed.code == 'Ok') {
							plotObject.distance = parsed.routes[0].distance / 1000;
							resolve()
						}
						else {
							plotObject.distance = '';
							resolve()
						}
					});
				});

				Promise.all([sqr, soilType, distance]).then(function () {
					resolve2();
				})
			})
		}
	});
}