//---------------------------------------------------------
// Name:      createSQRurl
// Purpose:   Creates a request URL for the soil quality
//			  index (from BGR WMS service) for a given 
//			  feature
// Args:      geoJSON feature (has to be polygon)
// Notes:     Dependant on turf.js and proj4.js
//---------------------------------------------------------
function createSQRurl (polygon) {
  var toProjection = new proj4.Proj('EPSG:3857');
  var fromProjection = new proj4.Proj('WGS84');

  var bboxArray = turf.bbox(polygon)
  var boundFirst = bboxArray.splice(0,2);
  var boundSecond = bboxArray;

  reprojectionFirst = proj4(fromProjection, toProjection, boundFirst);
  reprojectionSecond = proj4(fromProjection, toProjection, boundSecond);

  bboxString = reprojectionFirst.concat(reprojectionSecond).toString().replace(/,/g,'%2C')

  var urlStringSQR = 'https://services.bgr.de/wms/boden/sqr1000/?&REQUEST=GetFeatureInfo&SERVICE=WMS&CRS=EPSG%3A3857&STYLES=default&TRANSPARENT=true&VERSION=1.3.0&FORMAT=image%2Fpng&BBOX=' + bboxString + '&HEIGHT=830&WIDTH=561&LAYERS=18&QUERY_LAYERS=18&INFO_FORMAT=text%2Fhtml'

    return urlStringSQR
}

function createSoilTypeUrl (polygon) {
  var toProjection = new proj4.Proj('EPSG:3857');
  var fromProjection = new proj4.Proj('WGS84');

  var bboxArray = turf.bbox(polygon)
  var boundFirst = bboxArray.splice(0,2);
  var boundSecond = bboxArray;

  reprojectionFirst = proj4(fromProjection, toProjection, boundFirst);
  reprojectionSecond = proj4(fromProjection, toProjection, boundSecond);

  bboxString = reprojectionFirst.concat(reprojectionSecond).toString().replace(/,/g,'%2C')

  var urlStringSoilQuality = 'https://services.bgr.de/wms/boden/boart1000ob/?&REQUEST=GetFeatureInfo&SERVICE=WMS&CRS=EPSG%3A3857&STYLES=default&TRANSPARENT=true&VERSION=1.3.0&FORMAT=image%2Fpng&BBOX=' + bboxString + '&HEIGHT=880&WIDTH=514&LAYERS=0&QUERY_LAYERS=0&INFO_FORMAT=text%2Fhtml&I=452&J=371'

    return urlStringSoilQuality;
}

//---------------------------------------------------------
// Name:      sqrHtmlParsing
// Purpose:   Parses the HTMl response of a WMS info 
//			  request and pushes the result into a given
//			  result array
// Args:      html string, array
//---------------------------------------------------------
/*function sqrHtmlParsing (html, resultArray) {
    var parser = new DOMParser();
    var element = parser.parseFromString(html, "text/html");
    if (typeof element.getElementsByTagName("td")[3] == 'undefined') {
      resultArray.push(0);
    } else {
      resultArray.push(Number(element.getElementsByTagName("td")[3].innerHTML));
    }
}*/

function sqrHtmlParsing (html) {
    var parser = new DOMParser();
    var element = parser.parseFromString(html, "text/html");
    if (typeof element.getElementsByTagName("td")[3] == 'undefined') {
      return 0;
    } else {
      return Number(element.getElementsByTagName("td")[3].innerHTML);
    }
}

function soilTypeHtmlParsing (html) {
    var parser = new DOMParser();
    var element = parser.parseFromString(html, "text/html");
    if (typeof element.getElementsByTagName("td")[3] == 'undefined') {
      return '';
    } else {
      return element.getElementsByTagName("td")[3].innerHTML;
    }
}