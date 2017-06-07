//*********************************************************
// Section: 	Field selection
// Purpose: 	Display map
//				    Mapbox GL is used, including 'Draw'-Plugin
//				    New fields are added with the Polygon tool
//				    or the 'New Field' button
//*********************************************************
var language = 'de'
mapboxgl.accessToken = 'pk.eyJ1IjoidG9mZmkiLCJhIjoiY2l3cXRnNHplMDAxcTJ6cWY1YWp5djBtOSJ9.mBYmcCSgNdaRJ1qoHW5KSQ';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v9?optimize=true',
    center: [7.661594,51.433237],
    zoom: 8,
    dragPan: false,
    dragRotate: false
});

var Draw = new MapboxDraw({displayControlsDefault: false, controls: {
    polygon: true, 
    combine_features: true, 
    trash: true},
    styles: [
      // ACTIVE (being drawn)
      // line stroke
      {
          "id": "gl-draw-line",
          "type": "line",
          "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "#ffffff",
            "line-dasharray": [0.2, 2],
            "line-width": 2
          }
      },
      // polygon fill
      {
        "id": "gl-draw-polygon-fill",
        "type": "fill",
        "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        "paint": {
          "fill-color": "#ffffff",
          "fill-outline-color": "#ffffff",
          "fill-opacity": 0
        }
      },
      // polygon outline stroke
      // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
      {
        "id": "gl-draw-polygon-stroke-active",
        "type": "line",
        "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-color": "#ffffff",
          //"line-dasharray": [0.2, 2],
          "line-width": 2
        }
      },
      // vertex point halos
      {
        "id": "gl-draw-polygon-and-line-vertex-halo-active",
        "type": "circle",
        "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        "paint": {
          "circle-radius": 5,
          "circle-color": "#FFF"
        }
      },
      // vertex points
      {
        "id": "gl-draw-polygon-and-line-vertex-active",
        "type": "circle",
        "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        "paint": {
          "circle-radius": 3,
          "circle-color": "#79ae98",
        }
      },
      // midpoints
      {
        "id": "gl-draw-polygon-and-line-midpoint-active",
        "type": "circle",
        "filter": ["all", ["==", "meta", "midpoint"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
        "paint": {
          "circle-radius": 3,
          "circle-color": "#ffffff",
        }
      },

      // INACTIVE (static, already drawn)
      // line stroke
      {
          "id": "gl-draw-line-static",
          "type": "line",
          "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
          "layout": {
            "line-cap": "round",
            "line-join": "round"
          },
          "paint": {
            "line-color": "#ffffff",
            "line-width": 3
          }
      },
      // polygon fill
      {
        "id": "gl-draw-polygon-fill-static",
        "type": "fill",
        "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        "paint": {
          "fill-color": "#ffffff",
          "fill-outline-color": "#ffffff",
          "fill-opacity": 0.05
        }
      },
      // polygon outline
      {
        "id": "gl-draw-polygon-stroke-static",
        "type": "line",
        "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-color": "#ffffff",
          "line-width": 3
        }
      }
    ]
  });

map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');
map.addControl(Draw, 'bottom-left');
// add new field button


//---------------------------------------------------------
// Name:      calcArea
// Purpose:   Returns ha value of geoJSON feature
// Args:      geoJSON features
// Notes:     Dependant on turf.js
//---------------------------------------------------------
function calcArea (feature) {
    var area = turf.area(feature);
    // restrict area to 2 decimal points
    var roundedAreaHa = Number((area / 10000).toFixed(2));
    	return roundedAreaHa
}

//---------------------------------------------------------
// Name:      polyIntersect
// Purpose:   Checks if polygons intersect and returns
//            boolean
// Args:      geoJSON features
// Notes:     Dependant on turf.js
//---------------------------------------------------------
function polyIntersect (poly1, poly2) {
  var doesIntersect = true
  var intersectArea = turf.intersect(poly1,poly2)
  if (typeof intersectArea == 'undefined') {
    doesIntersect = false
  }
    return doesIntersect
}

//---------------------------------------------------------
// Name:      createBuffer
// Purpose:   Creates a "buffer" polygon, which offsets 
//            the boundaries of the original feature by
//            the amount of kilometers passed in size
// Args:      geoJSON feature, buffer size (number in km)
// Notes:     Dependant on turf.js
//---------------------------------------------------------
function createBuffer (feature, size) {
  bufferPoly = turf.buffer(feature,size,'kilometers')
    return bufferPoly
}

//---------------------------------------------------------
// Name:      initialRegionFinder
// Purpose:   Returns an array of regions, consisting of
//            all spatially coherent fields per region
// Args:      array of field Features, buffer size (number
//            in km)
// Notes:     Dependant on turf.js
//---------------------------------------------------------
function initialRegionFinder(fieldsFeatures, size, callback) {
  var regionArr = []
  var bufferFieldsArr = []
  // create buffer polygon for each field
  fieldsFeatures.forEach(function (field) {
    bufferFieldsArr.push(createBuffer(field, size))
  });

  var fields = bufferFieldsArr

  function findIntersections (counter) {
    var getField = fields.pop()
    var store = [getField]
    regionArr[counter] = [];
    regionArr[counter].push(getField);
    while (store.length > 0) {
      var storedField = store.pop()
      for (var i = 0; i < bufferFieldsArr.length; i++) {
        if (storedField !== bufferFieldsArr[i]) {
          var intersection = polyIntersect(storedField,bufferFieldsArr[i])
          if (intersection == true) {
            var index = fields.indexOf(bufferFieldsArr[i]);
            store.push(bufferFieldsArr[i]);
            regionArr[counter].push(bufferFieldsArr[i]);
            fields.splice(index, 1);
          }
        }
      }
    }
    if (fields.length > 0) {
      return findIntersections (counter + 1)
    } else {
      return callback(regionArr)
    }
  }

    return findIntersections(0)
}

//---------------------------------------------------------
// Name:      locationName
// Purpose:   Returns OSM request URL for center of
//            feature array
// Args:      array of point features
// Notes:     Dependant on turf.js
//---------------------------------------------------------
function locationUrl (features) {
  var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates[1] + '&lon=' + turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates[0] + '&format=json'; 
      return url
}

//---------------------------------------------------------
// Name:      locationName
// Purpose:   If available, returns reverse geocoded suburb,
//            else road or city name as string
// Args:      OSM response string (data), array to push
//            results to
//---------------------------------------------------------
function locationName(data, resultArray) {
        var dataObject = JSON.parse(data)
        if (!(typeof dataObject.address.suburb == 'undefined')) {
          resultArray.push(dataObject.address.suburb)
        } else if (!(typeof dataObject.address.suburb == 'road')){
          resultArray.push(dataObject.address.road)
        } else {
          resultArray.push(dataObject.address.city)
        }
}

//*********************************************************
// Section: 	Field selection
// Purpose: 	Event listeners
//				Check if new Polygon (field) is added, 
//				updated or removed and update DB 
//				accordingly
//*********************************************************
map.on('load', function () {
  // Get fields from DB if any
  // Draw fields on map
  function drawFields (fields) {
    Object.keys(fields).forEach(function (field) {
      if (typeof fields[field].polygon !== 'undefined') {
        Draw.add(fields[field].polygon)
      }
      else {
          console.log('No polygon found for ' + fields[field].name)
      }
    });
  }
    
  profile.bulkGet({
      docs: [
        {id: 'fields'},
        {id: 'info'}
      ]
    }).then(function (doc) {
      // both fields and cropsList exists
      if (doc.results[0].docs[0].ok && doc.results[1].docs[0].ok) {
        drawFields(doc.results[0].docs[0].ok);
        map.setCenter(doc.results[1].docs[0].ok.homeCoords); 
        map.setZoom(15);       
      }
      // just fields
      else if (doc.results[0].docs[0].ok && doc.results[1].docs[0].error) {
        drawFields(doc.results[0].docs[0].ok);
        var center = turf.bbox(Draw.getAll());
        map.fitBounds(center, {animate: false, padding: {top: 10, bottom:25, left: 15, right: 5}});
      }
      // just cropsList
      else if (doc.results[0].docs[0].error && doc.results[1].docs[0].ok) {
        map.setCenter(doc.results[1].docs[0].ok.homeCoords);
        map.setZoom(15); 
      }
      // none
      else {
        //
      }
    }).catch(function (err) {
      console.log(err)
  });

  // change language according to location
  map.setLayoutProperty('country-label-lg', 'text-field', '{name_' + language +'}');
  map.setLayoutProperty('place-city-lg-n', 'text-field', '{name_' + language +'}');
  map.setLayoutProperty('place-city-md-s', 'text-field', '{name_' + language +'}');
  map.setLayoutProperty('place-city-lg-s', 'text-field', '{name_' + language +'}');
  map.setLayoutProperty('place-city-sm', 'text-field', '{name_' + language +'}');
  map.setLayoutProperty('place-city-md-n', 'text-field', '{name_' + language +'}');

    return mapLoaded()
});

// handle creation of new fields
map.on('draw.create', function (data) {
	if (data.features.length > 0) {
        var area = calcArea(data.features[0]);
        // require name, fill-in previous crops
        // update DB
        var field = {};
        field.fieldid = data.features[0].id;
        field.polygon = data.features[0];
        field.size = area;
        field.polygon.properties = {};
        field.polygon.properties.name = field.fieldid;

        Draw.add(field.polygon);
        Draw.delete(data.features[0]);
        profile.get('fields').then(function (doc) {
          doc[field.fieldid] = field
          return profile.put(doc)
        }).catch(function (err) {
          if (err.status == 404) {
            var doc = {};
            doc[field.fieldid] = field
            return profile.put(doc)
          }
        })
        //firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/fields/').child(field.fieldid).update(field);
        // display value in sidebar
    }
});

// handle updates of field geometries
map.on('draw.update', function (data) {
	if (data.features.length > 0) {
        var area = calcArea(data.features[0]);
        // update DB
        //var field = {};
        //field.polygon = data.features[0];
        //field.size = area

        profile.get('fields').then(function (doc) {
          var field = doc[data.features[0].properties.name];
          field.polygon = data.features[0];
          field.size = area
          return profile.put(doc)
        }).catch(function (err) {
          console.log(err)
        })
        //firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/fields/').child(data.features[0].properties.name).update(field);
        // display value in sidebar
    }
});

// handle deletion of DBs
// future ToDo: put into archieve
map.on('draw.delete', function(data){
	// update DB
  //firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/fields/').child(data.features[0].properties.name).remove()
  profile.get('fields').then(function (doc) {
          delete doc[data.features[0].properties.name];
          return profile.put(doc);
  });
});

// handle combination of fields
map.on('draw.combine', function(data){
	if (data.deletedFeatures.length >= 2) {
    //var userPath = 'users/' + firebase.auth().currentUser.uid;
		var featuresArray = [];
    var field = {};
    // save field data of first deleted feature
    profile.get('fields').then(function (doc) {
        var field =  doc[data.deletedFeatures[0].properties.name];
        for (var i = 0; i < data.deletedFeatures.length; i++) {
          featuresArray.push(data.deletedFeatures[i]);
          // remove deleted features from DB
          delete doc[data.deletedFeatures[i].properties.name]
          //firebase.database().ref(userPath + '/fields/').child(data.deletedFeatures[i].properties.name).remove()
        }
        // delete "false" created combination from map
        Draw.delete(data.createdFeatures[0].id)

        // add combined feature to map
        var union = turf.union.apply(this, featuresArray);
        Draw.add(union)

        // update DB
        field.polygon = union;
        doc[field.name] = field;
        return profile.put(doc);
    });
    /*
    firebase.database().ref(userPath + '/fields/').child(data.deletedFeatures[0].properties.name).once('value').then(function(snapshot) {
      field = snapshot.val();
      for (var i = 0; i < data.deletedFeatures.length; i++) {
        featuresArray.push(data.deletedFeatures[i]);
        // remove deleted features from DB
        firebase.database().ref(userPath + '/fields/').child(data.deletedFeatures[i].properties.name).remove()
      }
      // delete "false" created combination from map
      Draw.delete(data.createdFeatures[0].id)

      // add combined feature to map
      var union = turf.union.apply(this, featuresArray);
      Draw.add(union)

      // updated DB
      field.polygon = union;
      firebase.database().ref(userPath + '/fields/').child(field.fieldid).update(field);
    });
    */
	}
});

// handle UI changes for field creation
map.on('draw.modechange', function (data) {
	if (data.mode == "draw_polygon") {
		// display 'create new field' popup
	}
});