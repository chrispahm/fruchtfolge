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
//---------------------------------------------------------
// G L O B A L E S
//var profile;
//var couchPath = 'http://v-server-node.ilb.uni-bonn.de:5984';
//---------------------------------------------------------

//---------------------------------------------------------
// Name:      signup
// Purpose:   Signs up new user
// Args:      usr name + pw as string
//---------------------------------------------------------
//function signup () {
document.getElementById('signup').onclick = function () {
	loadingScreen(signup, 2, 'weiter-data', null, 'EINEN AUGENBLICK BITTE');
}

function signup() {
	return new Promise (function (resolve, reject) {
		// signup
		var db = new PouchDB(couchPath + '/users', {skip_setup: true});
		var userdata = {
			'name': document.getElementById('name').value,
			'street': document.getElementById('street').value,
			'postcode': document.getElementById('postcode').value,
			'email': document.getElementById('email2').value,
			'password': document.getElementById('password2').value,
			'repeatPass': document.getElementById('repeatPass').value
		};
		for(var prop in userdata) {
			if (userdata[prop] == "") return reject('Bitte füllen Sie alle Felder aus');
		}	
		if (userdata.password !== userdata.repeatPass) return reject('Die eingegeben Passwörter stimmen nicht überein')

		var url = 'https://open.mapquestapi.com/geocoding/v1/address?key=eoEN8KRKeFAMe9JR8UG53yw5Gh3XU9Ex&location=' + userdata.street + ',' + userdata.postcode;
		
		return get(url).then(function (response) {
			var parsed = JSON.parse(response);
			if (!parsed.results[0].locations[0].latLng) return reject('Adresse konnte nicht gefunden werden');
			var homeCoords = [parsed.results[0].locations[0].latLng.lng, parsed.results[0].locations[0].latLng.lat];

			db.signup(userdata.email.replace(/[^a-zA-Z0-9]/g,''), userdata.password, function (err, response) {
			  if (err) {
			    if (err.name === 'conflict') {
			      return reject('Der Benutzername ist bereits vergeben')
			    } else if (err.name === 'forbidden') {
			      return reject('Der Benutzername ist nicht zulässig')
			    } else {
			      return reject('Ein unbekannter Fehler ist aufgetreten')
			    }
			  }
			  return db.login(userdata.email.replace(/[^a-zA-Z0-9]/g,''), userdata.password, function (err, response) {
				  if (err) {
				    if (err.name === 'unauthorized') {
				      // name or password incorrect, should not happen here
				    } else {
				      return reject("Ein fehler ist aufgetreten")
				    }
				  }
				  profile = new PouchDB(userdata.email.replace(/[^a-zA-Z0-9]/g,''));
					profile.sync( couchPath + '/userdb-' + toHex(response.name), {
							live: true,
							retry: true
					}).on('change', function (info) {
					  // handle change
					}).on('paused', function (err) {
					  // replication paused (e.g. replication up to date, user went offline)
					}).on('active', function () {
					  // replicate resumed (e.g. new changes replicating, user went back online)
					}).on('denied', function (err) {
					  // a document failed to replicate (e.g. due to permissions)
					}).on('complete', function (info) {
					  // handle complete
					}).on('error', function (err) {
					  // handle error
					});
				  profile.put({
					  	'_id': 'info',
					  	'name': userdata.name,
					  	'homeCoords': homeCoords,
					  	'street': userdata.street,
					  	'postcode': userdata.postcode
				  }).then(function () {
				  	// show navMenu after succesful login
					hideMenu(false);
				  	resolve();
				  });
				});
			});
		});
	})
};

//---------------------------------------------------------
// Name:      login
// Purpose:   user login
// Args:      usr name + pw as string
//---------------------------------------------------------
document.getElementById('login-button').onclick = function () {
	loadingScreen(login, 2, 'weiter-data', null, 'EINEN AUGENBLICK BITTE');
}

function login () {
	var db = new PouchDB(couchPath + '/users', {skip_setup: true});
	var username = document.getElementById('email').value.replace(/[^a-zA-Z0-9]/g,'');
	var password = document.getElementById('password').value;

	var promise = new Promise(function (resolve, reject) {
		db.login(username, password, function (err, response) {
		  if (err) {
		    if (err.name === 'unauthorized') {
		      reject('Benutzername/Password unbekannt')
		    } else {
		      reject('Ein unbekannter Fehler ist aufgetreten')
		    }
		  }
		  profile = new PouchDB(username.replace(/[^a-zA-Z0-9]/g,''));
			profile.sync( couchPath + '/userdb-' + toHex(response.name), {
					live: true,
					retry: true
			}).on('change', function (info) {
			  // handle change
			}).on('paused', function (err) {
			  // replication paused (e.g. replication up to date, user went offline)
			}).on('active', function () {
			  // replicate resumed (e.g. new changes replicating, user went back online)
			}).on('denied', function (err) {
			  // a document failed to replicate (e.g. due to permissions)
			}).on('complete', function (info) {
			  // handle complete
			}).on('error', function (err) {
			  // handle error
			});
			// show navMenu after succesful response
			hideMenu(false);
		  resolve(response)
		})
	})
	return promise
}

//---------------------------------------------------------
// Name:      login
// Purpose:   user login
// Args:      usr name + pw as string
//---------------------------------------------------------
/*
function loadingScreen(func1, step, button, PromiseArr, status) {
	// post status to status elem
	document.getElementById('loading-status').innerHTML = status;
	//
	var button = document.getElementById(button)
	// start spinner
	var target = document.getElementById("blur");
	var opts = {lines: 13 , length: 10 , width: 3 , radius: 9 , scale: 1 , corners: 1 , color: '#000', opacity: 0.25 , rotate: 0 , direction: 1 , speed: 1 , trail: 60 , fps: 20 , zIndex: 2e9 , className: 'spinner', top: '50%', left: '50%', shadow: false , hwaccel: false , position: 'absolute'}
	var spinner = new Spinner(opts).spin(target);
    // change button value to "wait"
    button.value = "WARTEN...";
    // 
    var elem = document.getElementById("wrapper");
	target.className = "";
    target.style.opacity = 1;
    setTimeout(function() {
    	goTo(step);
    	if (func1) {
		    func1().then(function () {
		    	target.style.opacity = 0;
			    button.value = 'WEITER';
			    setTimeout(function () {
			    	target.className = "blur-overlay";
			    	spinner.stop();
			    }, 700)
			    if (func1 !== 'dirtyHack' && step !== 1) {
					profile.get('info').then(function (info) {
						info.status = step;
						return profile.put(info);
					});
				};
		    }).catch(function (err) {
		    	alert(err);
		    	goTo(1);
		    	target.style.opacity = 0;
		    });
    	}
    	else {
    		Promise.all(PromiseArr.map(function (promise) {
    			return promise();
    		})).then(function () {
		    	target.style.opacity = 0;
			    button.value = 'WEITER';
			    setTimeout(function () {
			    	target.className = "blur-overlay";
			    	spinner.stop();
			    }, 700);
			    if (func1 !== 'dirtyHack' && step !== 1) {
					profile.get('info').then(function (info) {
						info.status = step;
						return profile.put(info);
					});
				};
		    }).catch(function (err) {
		    	alert(err);
		    	goTo(1);
		    	target.style.opacity = 0;
		    });
    	}
	}, 1000);
}
*/
function logout() {
	var db = new PouchDB(couchPath + '/users', {skip_setup: true});
	db.logout(function (err, response) {
	  if (err) {
	    // network error
	  }
	  hideMenu(true);
	  goTo(1);
	})
}

function checkEnter(e) {
    e = e || window.event;
    if (e.keyCode == '13') {
        e.target.blur();
        return false;
    }
}