//---------------------------------------------------------
// Name:      parseElanGml
// Purpose:   Parses Elan GML (plot geometries) file & 
//			  updates DB accordingly
// Args:      XML String, callback function
// Notes: 	  Dependant on ObjTree
//---------------------------------------------------------
function parseElanGml (xmlString, callback) {
	var xotree = new XML.ObjTree();
	var json = xotree.parseXML(xmlString);
	
	proj4.defs('EPSG:25832', "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");
  	var fromProjection = new proj4.Proj('EPSG:25832');
  	var toProjection = new proj4.Proj('WGS84');
  	var userPath = 'users/' + firebase.auth().currentUser.uid;

	firebase.database().ref(userPath + '/fields/').once('value').then(function(snapshot) {
	    if (snapshot) {
			Promise.all(json["wfs:FeatureCollection"]["gml:featureMember"].map(function (item){
				var id = item["elan:tschlag"]["elan:SCHLAGNR"];
				if (Object.keys(snapshot.val()).indexOf(id) > -1) {
					var coordinates = item["elan:tschlag"]["elan:GEO_COORD_"]["gml:Polygon"]["gml:outerBoundaryIs"]["gml:LinearRing"]["gml:coordinates"]["#text"].split(" ");
					var polygon = coordinates.map(function (latlng) {
						return proj4(fromProjection, toProjection, latlng.split(','));
					});

					var feature = turf.polygon([polygon], {name: id});
					//feature.id = id;

						return firebase.database().ref(userPath + '/fields').child(id).update({polygon: feature});
				}
			})).then(function () {
				if (callback) {
			    	return callback()
			    }
			});
		}
	});
}