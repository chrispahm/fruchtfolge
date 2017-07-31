function drawCropPage() {
  return new Promise (function (resolve, reject) {
    profile.get('info').then(function (info) {
      // restore default innerHTML
      document.getElementById('page3').innerHTML = "<div id='Leiste'></div> <div id='map'></div> <input id='weiter-map' class='weiter-oben' type='button' value='WEITER' /> <script type='text/javascript'> document.getElementById('weiter-map').onclick = function() {return loadingScreen(null, 4, 'weiter-map', [plotData,createCroppingPage], 'DISTANZEN UND BODENQUALITÄTEN WERDEN ABGEFRAGT') }; </script>"
      document.getElementById('weiter-map').onclick = function() {return loadingScreen(null, 4, 'weiter-map', [plotData,createCroppingPage], 'DISTANZEN UND BODENQUALITÄTEN WERDEN ABGEFRAGT') };
      //*********************************************************
      // Section:   Field selection
      // Purpose:   Display map
      //            Mapbox GL is used, including 'Draw'-Plugin
      //            New fields are added with the Polygon tool
      //            or the 'New Field' button
      //*********************************************************
      var language = 'de'
      mapboxgl.accessToken = 'pk.eyJ1IjoidG9mZmkiLCJhIjoiY2l3cXRnNHplMDAxcTJ6cWY1YWp5djBtOSJ9.mBYmcCSgNdaRJ1qoHW5KSQ';

      var map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/satellite-streets-v9?optimize=true',
          center: info.homeCoords,
          zoom: 14,
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

      //*********************************************************
      // Section:   Field selection
      // Purpose:   Event listeners
      //        Check if new Polygon (field) is added, 
      //        updated or removed and update DB 
      //        accordingly
      //*********************************************************
      map.on('load', function () {
        // Get fields from DB if any
        // Draw fields on map
        profile.get('fields').then(function (fields) {
          if (fields) {
            var totArea = 0;
            Object.keys(fields).forEach(function (field) {
              if (field === '_rev' || field === '_id') return
              else if (typeof fields[field].polygon !== 'undefined') {
                fields[field].polygon.properties.id = field;
                Draw.add(fields[field].polygon);
                fields[field].size = calcArea(fields[field].polygon);
                totArea += fields[field].size;
              }
              else {
                  console.log('No polygon found for ' + fields[field].name)
              }
            });
            // post status to status elem
            document.getElementById('loading-status').innerHTML = 'ANBAUREGIONEN WERDEN ERFASST';
            // get regions
            initialRegionFinder(Draw.getAll().features, 0.4).then(function (result) {
              var locations = result.map(locationUrl);
              var requests = [Promise.resolve(result)];
              locations.forEach(function (location) {
                return requests.push(get(location).then(locationName).catch(function (err) {
                  console.log(err)
               }));
              })
              return Promise.all(requests)
            }).then(function (result) {
              var regions = result[0];
              var leiste = document.getElementById('Leiste');
              var gesamtflaecheLeiste = document.createElement('h1');
              gesamtflaecheLeiste.innerHTML = "GESAMT " + totArea.toFixed(1) + " ha";
              leiste.appendChild(gesamtflaecheLeiste);

              regions.forEach(function (region, index) {
                var regionDiv = document.createElement('div');
                var regionEintrag = document.createElement('h2');
                var regionFelderDiv = document.createElement('div');
                regionFelderDiv.className = 'expand';
                regionEintrag.innerHTML = result[index + 1].toUpperCase();

                regions[index].forEach(function (plot) {
                  var regionFelder = document.createElement('p');
                  var plotName = fields[plot.properties.id].name || 'Ohne Bezeichnung';
                  regionFelder.innerHTML = plotName + ", " + fields[plot.properties.id].size + " ha";
                  regionFelder.id = plot.properties.id;
                  regionFelder.onclick = function(x) {
                      profile.get('fields').then(function (plots) {
                        var source = x.target.id;
                          var destination = turf.centerOfMass(plots[source].polygon);
                          map.flyTo({center: destination.geometry.coordinates, zoom: 16});
                          var FelderClicked = document.getElementById("Leiste").getElementsByTagName('p');
                          for (var j = 0; j < FelderClicked.length; j++) {
                              if (FelderClicked[j].classList.contains('geclickt')) {
                                  FelderClicked[j].classList.remove('geclickt');
                              }
                          }
                          x.target.classList.toggle("geclickt");
                      });
                  };
                  regionFelder.ondblclick = function() {
                    var ursprung = this.innerHTML;
                    var id = this.id;
                    if (ursprung != "<input type=\"text\">") {
                         var text = this.innerHTML.split(',');
                         this.innerHTML = "";
                         var textfeld = document.createElement("INPUT");
                         textfeld.setAttribute("type", "text");
                         textfeld.value = text[0];
                         this.appendChild(textfeld);
                         textfeld.focus();
                         textfeld.onkeypress = checkEnter;
                         textfeld.onblur = function() {
                            profile.get('fields').then(function (plots){
                               if (textfeld.value == text[0]) {
                                   document.getElementById(id).innerHTML = text[0] + ', ' + fields[id].size + ' ha';
                                   return
                               } else {
                                   document.getElementById(id).innerHTML = textfeld.value + ', ' + fields[id].size + ' ha';
                                   plots[id].name = textfeld.value;
                                   return profile.put(plots);
                               }
                            })
                         };
                    } 
                  };
                  regionFelderDiv.appendChild(regionFelder);
                  fields[plot.properties.id].region = result[index + 1];
                });
                regionEintrag.onclick = function() { erweitern(this); };

                function erweitern(x) {
                    x.__toggle = !x.__toggle;
                    var target = x.nextSibling;

                    if( x.__toggle) {
                        target.style.height = target.scrollHeight+"px";
                    }
                    else {
                        target.style.height = 0;
                    }
                }

                regionDiv.appendChild(regionEintrag);
                regionDiv.appendChild(regionFelderDiv);
                leiste.appendChild(regionDiv);
              });
              map.resize();
              return resolve(profile.put(fields))
            })
          }
        });
          
        // change language according to location
        map.setLayoutProperty('country-label-lg', 'text-field', '{name_' + language +'}');
        map.setLayoutProperty('place-city-lg-n', 'text-field', '{name_' + language +'}');
        map.setLayoutProperty('place-city-md-s', 'text-field', '{name_' + language +'}');
        map.setLayoutProperty('place-city-lg-s', 'text-field', '{name_' + language +'}');
        map.setLayoutProperty('place-city-sm', 'text-field', '{name_' + language +'}');
        map.setLayoutProperty('place-city-md-n', 'text-field', '{name_' + language +'}');

      });

      // handle creation of new fields
      map.on('draw.create', function (data) {
        if (data.features.length > 0) {
              var area = calcArea(data.features[0]);
              // require name, fill-in previous crops
              // update DB
              var field = {};
              field.fieldid = data.features[0].id;
              field.name = prompt('Bitte geben Sie einen Name für das Feld ein', 'Ohne Bezeichnung');
              if (field.name == "" || field.name == null) field.name = 'Ohne Bezeichnung'
              //field.name = data.features[0].id;
              field['2017'] = prompt('Bitte geben Sie die Vorfrucht aus der Anbauperiod 2016/2017 ein', "Winterweizen")
              if (field['2017'] == "" || field['2017'] == null) field['2017'] = '';
              field['2016'] = prompt('Bitte geben Sie die Vorfrucht aus der Anbauperiod 2015/2016 ein', "Winterweizen")
              if (field['2016'] == "" || field['2016'] == null) field['2016'] = '';
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
          }
      });

      // handle updates of field geometries
      map.on('draw.update', function (data) {
        if (data.features.length > 0) {
              var area = calcArea(data.features[0]);
              // update DB
              profile.get('fields').then(function (doc) {
                var field = doc[data.features[0].properties.name];
                field.polygon = data.features[0];
                field.size = area
                return profile.put(doc)
              }).catch(function (err) {
                console.log(err)
              })
              // display value in sidebar
          }
      });

      // handle deletion of DBs
      // future ToDo: put into archieve
      map.on('draw.delete', function(data){
        // update DB
        profile.get('fields').then(function (doc) {
                delete doc[data.features[0].properties.name];
                return profile.put(doc);
        });
      });

      // handle combination of fields
      map.on('draw.combine', function(data){
        if (data.deletedFeatures.length >= 2) {
          var featuresArray = [];
          var field = {};
          // save field data of first deleted feature
          profile.get('fields').then(function (doc) {
              var field =  doc[data.deletedFeatures[0].properties.name];
              for (var i = 0; i < data.deletedFeatures.length; i++) {
                featuresArray.push(data.deletedFeatures[i]);
                // remove deleted features from DB
                delete doc[data.deletedFeatures[i].properties.name]
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
        }
      });

      // handle UI changes for field creation
      map.on('draw.modechange', function (data) {
        if (data.mode == "draw_polygon") {
          // display 'create new field' popup
        }
      });
    });
  });
}

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
function initialRegionFinder(fieldsFeatures, size) {
  return new Promise (function (resolve, reject) {
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
        return resolve(regionArr)
      }
    }

      return findIntersections(0)
  })
}

//---------------------------------------------------------
// Name:      locationName
// Purpose:   Returns OSM request URL for center of
//            feature array
// Args:      array of point features
// Notes:     Dependant on turf.js
//---------------------------------------------------------
function locationUrl (features) {
  var url = 'http://open.mapquestapi.com/geocoding/v1/reverse?key=eoEN8KRKeFAMe9JR8UG53yw5Gh3XU9Ex&location=' + turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates[1] + ',' + turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates[0];
  //var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates[1] + '&lon=' + turf.centerOfMass(turf.featureCollection(features)).geometry.coordinates[0] + '&format=json'; 
      return url
}

//---------------------------------------------------------
// Name:      locationName
// Purpose:   If available, returns reverse geocoded suburb,
//            else road or city name as string
// Args:      OSM response string (data), array to push
//            results to
//---------------------------------------------------------
function locationName(data) {
        var dataObject = JSON.parse(data)
        /* OSM Version
        if (!(typeof dataObject.address.suburb == 'undefined')) {
          return dataObject.address.suburb;
        } else if (!(typeof dataObject.address.suburb == 'road')){
          return dataObject.address.road;
        } else {
          return dataObject.address.city;
        } */
        if (!dataObject.results[0].locations[0].adminArea6 === '') {
          return dataObject.results[0].locations[0].adminArea6;
        } else if (!dataObject.results[0].locations[0].street === ''){
          return dataObject.results[0].locations[0].street;
        } else {
          return dataObject.results[0].locations[0].adminArea5;
        }
}