//---------------------------------------------------------
// Name:      asyncReq
// Purpose:   Takes an array of URLs, requests each and
//			  returns the response to a given callback
//			  function
// Args:      array of urls, callback function
// Optional:  array where callback will push results to,
//			  function to call on completion
//---------------------------------------------------------
function asyncReq (urlArray, callback, resultArray, success) {
  Promise.all(urlArray.map(get)).then(function (url) {
    url.forEach(function (index) {
      return callback(index, resultArray);
    });
  }).catch(function (err) {
    // error handling in here
  }).then(function () {
    if (!(typeof success == 'undefined')) {
      return success()
    }
  })
}

//---------------------------------------------------------
// Name:      get
// Purpose:   Takes a URL, makes an AJAX call and on
//			  success returns response value, else
//			  failure status
// Args:      url string
//---------------------------------------------------------
function get(url) {
  var requestPromise = new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('get', url);

    req.onload = function() {
      if (req.status == 200) {
        resolve(req.response);
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