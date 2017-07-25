//---------------------------------------------------------
// Name:      toHex
// Purpose:   Hex encodes string
// Args:      string to encode
//---------------------------------------------------------
function toHex (str) {
	var hex= ''
	for (var i=0; i < str.length; i++) {
		hex += str.charCodeAt(i).toString(16);
	}
		return hex
}

//---------------------------------------------------------
// G L O B A L E S
var profile;
var couchPath = 'http://v-server-node.ilb.uni-bonn.de:5984';
//---------------------------------------------------------
//---------------------------------------------------------
// Name:      signup
// Purpose:   Signs up new user
// Args:      usr name + pw as string
//---------------------------------------------------------
//function signup () {
document.getElementById('signup').onclick = function () {
	var db = new PouchDB(couchPath + '/users', {skip_setup: true});
	var userdata = {
		'name': document.getElementById('name').value,
		'street': document.getElementById('street').value,
		'postcode': document.getElementById('postcode').value,
		'email': document.getElementById('email2').value,
		'password': document.getElementById('password2').value,
		'repeatPass': document.getElementById('repeatPass').value
	};
	//for(var prop in userdata) {
	//	if (userdata[prop] == "") return alert('Bitte füllen Sie alle Felder aus')
	//}	
	if (userdata.password !== userdata.repeatPass) return alert('Die eingegeben Passwörter stimmen nicht überein')

	var url = 'http://open.mapquestapi.com/geocoding/v1/address?key=eoEN8KRKeFAMe9JR8UG53yw5Gh3XU9Ex&location=' + userdata.street + ',' + userdata.postcode;
	
	return get(url).then(function (response) {
		var parsed = JSON.parse(response);
		if (!parsed.results[0].locations[0].latLng) return alert('Adresse konnte nicht gefunden werden');
		var homeCoords = [parsed.results[0].locations[0].latLng.lng, parsed.results[0].locations[0].latLng.lat];

		db.signup(userdata.email.replace(/[^a-zA-Z0-9]/g,''), userdata.password, function (err, response) {
		  if (err) {
		    if (err.name === 'conflict') {
		      return alert('Der Benutzername ist bereits vergeben')
		    } else if (err.name === 'forbidden') {
		      return alert('Der Benutzername ist nicht zulässig')
		    } else {
		      return alert('Ein unbekannter Fehler ist aufgetreten')
		    }
		  }
		  return db.login(userdata.email.replace(/[^a-zA-Z0-9]/g,''), userdata.password, function (err, response) {
			  if (err) {
			    if (err.name === 'unauthorized') {
			      // name or password incorrect, should not happen here
			    } else {
			      return alert("Ein fehler ist aufgetreten")
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
			  }).then(function (err) {
			  	if(err) console.log(err);
			  	return goTo(2);
			  });
			});
		});

	});
};

//---------------------------------------------------------
// Name:      login
// Purpose:   user login
// Args:      usr name + pw as string
//---------------------------------------------------------
function login (username, password) {
	var db = new PouchDB(couchPath + '/users', {skip_setup: true});

	var promise = new Promise(function (resolve, reject) {
		db.login(username, password, function (err, response) {
		  if (err) {
		    if (err.name === 'unauthorized') {
		      reject('Benutzername/Password unbekannt')
		    } else {
		      reject('Ein unbekannter Fehler ist aufgetreten')
		    }
		  }
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
function loadingScreen(func) {
	// start spinner
	var target = document.getElementById("blur");
	var opts = {lines: 13 , length: 10 , width: 3 , radius: 9 , scale: 1 , corners: 1 , color: '#000', opacity: 0.25 , rotate: 0 , direction: 1 , speed: 1 , trail: 60 , fps: 20 , zIndex: 2e9 , className: 'spinner', top: '50%', left: '50%', shadow: false , hwaccel: false , position: 'absolute'}
	var spinner = new Spinner(opts).spin(target);
    target.style.visibility = "visible"; 
    // change button value to "wait"
    var button = document.getElementById("weiter")
    button.value = "WARTEN...";
    // 
    var elem = document.getElementById("wrapper");
    var opacity = 0;
    setInterval(function () {
    	if (opacity == 100) {
      		clearInterval();
      	}
      	else {
      		opacity++; 
      		target.style.opacity = (opacity/100);
      	}
    }, 10);

    setTimeout(function() {
	    Promise.all(func).then(function () {
	    	opacity = 0;
	    	setInterval(function () {
		    	if (opacity == 100) {
		      		clearInterval();
		      		target.style.visibility = "hidden";
      				spinner.stop();
		      	}
		      	else {
		      		opacity++; 
		      		target.style.opacity = (100-opacity)/100;
		      	}
		    }, 10);
	    });
	}, 2000);
}