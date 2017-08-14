function addLineChart (timePrev, timeCur) { 
    var configLine = {
                type: 'line',
                data: {
                    labels: ["August", "September", "Oktober", "November", "Dezember", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
                    datasets: [{
                        label: "Arbeitszeitbedarf 2017",
                        backgroundColor: "#4A6D7C",
                        borderColor: "#4A6D7C",
                        data: [Number(timePrev[0].AUG.toFixed(2)), Number(timePrev[0].SEP.toFixed(2)), Number(timePrev[0].OKT.toFixed(2)), Number(timePrev[0].NOV.toFixed(2)), Number(timePrev[0].DEZ.toFixed(2)), Number(timePrev[1].JAN.toFixed(2)), Number(timePrev[1].FEB.toFixed(2)), Number(timePrev[1].MRZ.toFixed(2)), Number(timePrev[1].APR.toFixed(2)), Number(timePrev[1].MAI.toFixed(2)), Number(timePrev[1].JUN.toFixed(2)), Number(timePrev[1].JUL.toFixed(2)), Number(timePrev[1].AUG.toFixed(2)), Number(timePrev[1].SEP.toFixed(2)), Number(timePrev[1].OKT.toFixed(2)), Number(timePrev[1].NOV.toFixed(2)), Number(timePrev[1].DEZ.toFixed(2))], 
                        fill: false,
                    }, {
                        label: "Arbeitszeitbedarf 2018",
                        backgroundColor: "#79ae98",
                        borderColor: "#79ae98",
                        data: [Number(timeCur[0].AUG.toFixed(2)), Number(timeCur[0].SEP.toFixed(2)), Number(timeCur[0].OKT.toFixed(2)), Number(timeCur[0].NOV.toFixed(2)), Number(timeCur[0].DEZ.toFixed(2)), Number(timeCur[1].JAN.toFixed(2)), Number(timeCur[1].FEB.toFixed(2)), Number(timeCur[1].MRZ.toFixed(2)), Number(timeCur[1].APR.toFixed(2)), Number(timeCur[1].MAI.toFixed(2)), Number(timeCur[1].JUN.toFixed(2)), Number(timeCur[1].JUL.toFixed(2)), Number(timeCur[1].AUG.toFixed(2)), Number(timeCur[1].SEP.toFixed(2)), Number(timeCur[1].OKT.toFixed(2)), Number(timeCur[1].NOV.toFixed(2)), Number(timeCur[1].DEZ.toFixed(2))], 
                        fill: false,
                    }]
                },
                options: {
                    responsive: true,
		    maintainAspectRatio: false,
                    title:{
                        display:false,
                        text:'Arbeitszeitbedarf'
                    },
                    tooltips: {
                        mode: 'index',
                        intersect: false,
                    },
                    hover: {
                        mode: 'nearest',
                        intersect: true
                    },
                    scales: {
                        xAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: 'Monat'
                            }
                        }],
                        yAxes: [{
                            display: true,
                            scaleLabel: {
                                display: true,
                                labelString: 'h / Monat'
                            }
                        }]
                    }
                }
            };
            

    var ctx = document.getElementById("linechart").getContext("2d");
    return new Chart(ctx, configLine);   
}