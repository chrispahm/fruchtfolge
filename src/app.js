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

function signup (username, password) {
	var db = new PouchDB('http://v-server-node.ilb.uni-bonn.de:5984/users', {skip_setup: true});

	var promise = new Promise(function (resolve, reject) {
		db.signup(username, password, {
			metadata: {
				email: email
			}
		}, function (err, response) {
		  if (err) {
		    if (err.name === 'conflict') {
		      reject('Der Benutzername ist bereits vergeben')
		    } else if (err.name === 'forbidden') {
		      reject('Der Benutzername ist nicht zulässig')
		    } else {
		      reject('Ein unbekannter Fehler ist aufgetreten')
		    }
		  }
		  resolve(response)
		})
	})
	return promise
}

function login (username, password) {
	var db = new PouchDB('http://v-server-node.ilb.uni-bonn.de:5984/users', {skip_setup: true});

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