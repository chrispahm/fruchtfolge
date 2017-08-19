function createChart(cropSum) {
	var data = [];
	var dataUnsorted = [];
	var labels = [];
	var backgroundColor = [];

	//var colors = ["#D0D1D3", "#BBE29D", "#79ae98", "#7690A5", "#4A6D7C", "#294D4A", "#27ae60", '#f39c12', "#7f8c8d"];
	
	var colors = ["#294D4A", "#4A6D7C", "#7690A5", "#79ae98", "#BBE29D", "#9DD5C0", '#B5DCE1', "#D0D1D3", "#B5DCE1"]
	Object.keys(cropSum).forEach(function (crop) {
    if (crop == "_rev" || crop == "_id") return
		dataUnsorted.push([parseFloat(cropSum[crop].toFixed(1)), crop]);
	});
	var sorted = dataUnsorted.sort(Comparator);
	window.cropColor = {};

	sorted.forEach(function (item, index) {
		data.push(item[0]);
		labels.push(item[1]);
		backgroundColor.push(colors[index])
		cropColor[item[1]] = colors[index];
	})

	Chart.defaults.global.defaultFontFamily = "open_sanscondensed_light";
    Chart.defaults.global.defaultFontSize = 16;

    var config = {
        type: 'pie',
        data: {
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                label: 'Summe Kulturen'
            }],
            labels: labels
        },
        options: {
            responsive: false,
            legend: {
            	position: "bottom"},
        tooltips: {
              callbacks: {
                  label: function(tooltipItem, data) {
                      var value = data.datasets[0].data[tooltipItem.index];
                      var label = data.labels[tooltipItem.index];
//                      var percentage = Math.round(value / totalSessions * 100);
                      return label + ': ' + value + ' ha';
                  }
              },
              xPadding: 6,
              yPadding: 7,
              displayColors: false
          }
        }
    };

	var ctx = document.getElementById("chart-area").getContext("2d");
    window.cropSharesPie = new Chart(ctx, config);

    return window.cropColor;
}

function Comparator(a, b) {
   if (a[0] < b[0]) return 1;
   if (a[0] > b[0]) return -1;
   return 0;
 }