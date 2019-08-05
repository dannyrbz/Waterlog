function renderChart(datasets, labels, months) {

    for (i = 0; i < datasets.length; i++) {
        data = datasets[i];
        month = months[i];
    document.getElementById("chart" + month).innerHTML = month + ', 2019';

    //"<canvas " + "id=" + month  + " width='400' height='150'></canvas>";
    var ctx = document.getElementById(month).getContext('2d');
    //var myChart = new Chart(ctx, config);
    //myChart.destroy();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: "Usage (Liters)",
                backgroundColor: "rgba(0, 195, 255, 0.8)",
                data: data
            }],
        },
        options: {
            legend: {
               display: false
            },
            tooltips: {
               enabled: true
            },
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Day of the month'
                      },
                  ticks: {
                    stepSize: 5
                }}
            ],
            yAxes: [{
                scaleLabel: {
                  display: true,
                  labelString: 'Water consumption (Liters)'
                }
              }],
        }
        }});
    }
    new Siema();
};

$("#renderBtn").click(
    function () {
        var meterId = document.getElementById("inputmeterid").value;
        document.getElementById("daily-media").innerHTML = '<div class="media-body"><div class="progressbarchart" id="daily-usage-circle"></div></div>';
        document.getElementById("reading-media").innerHTML = "<table class='reading-table' id='recent-readings'><tr><th><h5>First reading</h5></th><td id='first-reading'></td></tr><tr class='reading-row'><th><h5>Time</h5></th><th><h5>Usage</h5></th></tr></table>";
        //<h5 class='card-title'>Today's readings</h5>

        firebaseDb.collection("meters").doc(meterId).get().then(function(doc) {
            if (doc.exists) {
                document.getElementById("dashboard1").style = "display: block";
                var meterId = document.getElementById("inputmeterid").value;
                const monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
                var initialDataList = []; // Holds the date and reading taken from firestore
                var groupedList = []; // List with readings grouped by date
                var dailyUsageList = []; // Usage per day
                var usageToday = 0; // Usage for the current day
                var numberPeople = 0; // Number of people in the household
                var target = 0; // Meter set target
                var dailySortMonthYear = []; // Daily usage grouped by month and year
                var data = []; // Data for chart
                var labels = []; // Labels for chart
                var dateToday = new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear(); // Current date

                // Gets the date and reading from firestore
                firebaseDb.collection("meters").doc(meterId).collection('readings').orderBy('createdAt').get().then(function(querySnapshot) {
                    querySnapshot.forEach(function(doc) {
                    var docDate = doc.data().createdAt.toDate();
                    var newDate = docDate.getDate() + "/" + (docDate.getMonth() + 1) + "/" + docDate.getFullYear(); 
                    var obj = {};

                    obj["date"] = newDate;
                    obj["reading"] = doc.data().reading;
                    initialDataList.push(obj);
                });

                // Groups readings based on the date
                var groups = {};
                for (var i = 0; i < initialDataList.length; i++) {
                    var groupDate = initialDataList[i].date;
                    if (!groups[groupDate]) {
                        groups[groupDate] = [];
                    }
                    groups[groupDate].push(initialDataList[i].reading);
                }
                for (var groupName in groups) {
                    groupedList.push({date: groupName, reading: groups[groupName]});
                }

                // Getting usage from readings for each day
                for (var i = 0; i < groupedList.length; i++) {
                    var length = groupedList[i].reading.length - 1;
                    var reading = groupedList[i].reading[length] - groupedList[i].reading[0];
                    var obj = {};
                    obj["date"] = groupedList[i].date;
                    obj["usage"] = reading;
                    dailyUsageList.push(obj);
                }

                // Groups daily usage list by month and year
                var tempDailyMonthYear = {};
                for (var i = 0; i < groupedList.length; i++) {
                    var groupDate = groupedList[i].date;
                    var monthYear = groupDate.substring(groupDate.indexOf('/') + 1, groupDate.length);
                    if (!tempDailyMonthYear[monthYear]) {
                        tempDailyMonthYear[monthYear] = [];
                    }
                    tempDailyMonthYear[monthYear].push({date: groupDate, usage: dailyUsageList[i].usage});
                }
                for (var monthYear in tempDailyMonthYear) {
                    var month = monthYear.substring(0, monthYear.indexOf('/'));
                    var year = monthYear.substring(monthYear.indexOf('/') + 1, monthYear.length);
                    dailySortMonthYear.push({month: month, year: year, entry: tempDailyMonthYear[monthYear]});
                }

                // Pre-fills chart data and label sets
                for (i = 1; i < 32; i++) {
                    labels.push(i);
                }
                
                // Filling chart data and label with firestore data
                var datasets = [];
                var months = [];
                document.getElementById('chartsDiv').textContent = '';
                for (i = 0; i < dailySortMonthYear.length; i++) {
                    var month = monthNames[(dailySortMonthYear[i].month - 1)]
                    var entry = dailySortMonthYear[i].entry;

                    data = [];
                    for (j = 1; j < 31; j++) {
                        data[j] = 0;
                    }
        
                    for (k = 0; k < entry.length; k++) {
                        var entryDateDay = parseInt(entry[k].date.substring(0, entry[k].date.indexOf('/'))) - 1;
                        var usage = parseInt(entry[k].usage);
                        data[entryDateDay] = usage
                    };
                    document.getElementById("chartsDiv").innerHTML += '<div><h3 class="section-title" id="chart' + month + '">Date</h3><br><canvas id="' + month + '" width="400" height="150"></canvas></div>';
                    datasets.push(data);
                    months.push(month);
                };
                renderChart(datasets, labels, months);

                // Get current monthly average
                var currentMonth = new Date().getMonth() + 1;
                var listLastObject = dailySortMonthYear.length - 1
                var listLatestMonth = dailySortMonthYear[listLastObject].month;
                var lastestMonthEntry = dailySortMonthYear[listLastObject].entry;
                var totalUsage = 0;

                if (currentMonth == listLatestMonth) {
                    for (i = 0; i < lastestMonthEntry.length; i++) {
                        totalUsage += lastestMonthEntry[i].usage;
                    };
                    document.getElementById('monthly').innerHTML = Math.round(totalUsage) + " litres";
                }

                // Get current weekly average
                document.getElementById('weekly').innerHTML = Math.round(totalUsage/4) + " litres"
                
                // Get postcode average
                var meterPostcode = "";
                firebaseDb.collection("meters").doc(meterId).get().then(function(doc) {
                    meterPostcode = doc.data().postcode;
                    

                    firebaseDb.collection("usageByPostcode").doc(meterPostcode).get().then(function(doc) {
                        document.getElementById('postcode').innerHTML = doc.data().usage + " litres/day";
                    })
                });

                // Get and set Reservoir level
                firebaseDb.collection("reservoirData").doc("total").get().then(function(doc) {
                    document.getElementById('reservoir').innerHTML = doc.data().percentFull + " %";
                })
            });
            } else {
                document.getElementById("dashboard1").style = "display: none";
                alert("Meter ID does not exist");
            };

            // Get today's reading to create recent readings
            var readingToday = [];
            firebaseDb.collection("meters").doc(meterId).collection('readings').orderBy('createdAt').get().then(function(querySnapshot) {
                querySnapshot.forEach(function(doc) {
                var docDate = doc.data().createdAt.toDate();
                var newDate = docDate.getDate() + "/" + (docDate.getMonth() + 1) + "/" + docDate.getFullYear();
                var hours = docDate.getHours();
                var minutes = docDate.getMinutes();
                var amPm = "AM";
                var reading = doc.data().reading; 
                var time = "0"         
                if (minutes == 0) {
                    minutes = "00";
                }
                if (hours > 12) {
                    hours = hours - 12;
                    amPm = "PM";
                }
                if (hours.toString().length == 1) {
                    hours = "0" + hours.toString();
                }

                time = hours + ":" + minutes + " " + amPm;  

                if (newDate == dateToday) { //*********************************************************************************************************************************************************************CHANGE THIS */
                    readingToday.push({time: time, reading: reading});
                }     
            });

            if (readingToday.length == 0) {
                document.getElementById("daily-media").innerHTML = '';
                document.getElementById("reading-media").innerHTML = '';
                document.getElementById("daily-media").innerHTML += '<div class="media-body"><img class="warning" src="images/question.png" alt="image"><h5 class="warningtext">No data found for today</h5></div>';
                document.getElementById("reading-media").innerHTML += '<div class="media-body"><img class="warning" src="images/question.png" alt="image"><h5 class="warningtext">No readings found for today</h5></div>';
            } else {
                document.getElementById("first-reading").innerHTML = '<p>' + readingToday[0].reading + '</p>';
            for (i = 0; i < readingToday.length - 1; i++) {
                var firstReading = readingToday[0].reading;
                var secondReading = readingToday[i+1].reading;
                var usage = secondReading - firstReading;
                var time = readingToday[i+1].time;
                document.getElementById("recent-readings").innerHTML += "<tr><td><p>" + time + "</p></td><td><p>" + usage + " litres" + "</p></td></tr>";
            }
            usageToday = readingToday[readingToday.length - 1].reading - firstReading;


            // Get data from firebase for today's daily usage dash
            firebaseDb.collection("meters").doc(meterId).get().then(function(doc) {
                target = doc.data().target;
                numberPeople = doc.data().people;                

                // Create today's daily usage dash
                var progressbars = [];
                progressbars.forEach(function(bar){
                    bar.destroy();
                });

                var dailyProgressBar = document.getElementById("daily-usage-circle");
                var bar = new ProgressBar.Circle(dailyProgressBar, {
                    color: '#8ea6e9',
                    trailColor: '#555',
                    trailWidth: 1,
                    duration: 1400,
                    easing: 'easeInOut',
                    strokeWidth: 15,
                    svcStyle: null,
                    text: {
                        autoStyleContainer: false,
                      },
                    // Set default step function for all animate calls
                    step: function(state, circle) {
                      circle.setText('<div class="daily-usage-text">' + (Math.round(usageToday/numberPeople)) + "/" + target + " litres" + "<br>" + "Daily per person</div>");
                    }
                  });
                bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
                progressbars.push(bar);
                progressbars.forEach(function(bar){
                    bar.animate((usageToday/numberPeople)/target);
                }); 
            });}
        });
    });
});


$("#inputmeterid").keyup(function(event) {
    if (event.keyCode === 13) {
        $("#renderBtn").click();
    }
});

