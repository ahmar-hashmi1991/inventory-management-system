var user = window.sessionStorage.getItem('user');
if(user != "superuser" && user != "purchaseteam" && user != "salesteam"){
	window.location.assign("index.html");
}

if(user == "purchaseteam"){
	$('#side-bar').find('li').each(function(){
		if($(this).index()!=2){
			$(this).css('display','none');
		}
	});
}else if(user =="salesteam"){
	$('#side-bar').find('li').each(function(){
		if($(this).index()!=1){
			$(this).css('display','none');
		}
	});	
}

var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.name);
	$('select[name="q1"]').append(option1);
}

// get id
var id = parseInt($.url().param('id'));
$("input[name=id]").val(id);

// read item data
var sql = 'SELECT item.id, whouse.name, item.code, item.maker, item.detail, item.price, stock.balance,stock.threshold \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE stock.id = ?';
var row = alasql(sql, [ id ])[0];
$('#image').attr('src', 'img/' + row.id + '.jpg');
$('#whouse').text(row.name);
$('#code').text(row.code);
$('#maker').text(row.maker);
$('#detail').text(row.detail);
$('#price').text(numberWithCommas(row.price));
var balance = row.balance; // will be used later
$('#balance').text(balance);
$('#threshold').text(row.threshold);

// read transaction
var rows = alasql('SELECT * FROM trans WHERE stock = ? ORDER BY date', [ id ]);
var tbody = $('#tbody-transs');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var tr = $('<tr>').appendTo(tbody);
	tr.append('<td>' + row.date + '</td>');
	tr.append('<td>' + row.qty + '</td>');
	tr.append('<td>' + row.balance + '</td>');
	tr.append('<td>' + row.memo + '</td>');
}

// storage/retrieval
$('#update').on('click', function() {
	var date = $('input[name="date"]').val();
	var qty = parseInt($('input[name="qty"]').val());
	var memo = $('textarea[name="memo"]').val();
	alasql('UPDATE stock SET balance = ? WHERE id = ?', [ balance + qty, id ]);
	var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
	alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, id, date, qty, balance + qty, memo, "" ]);
	window.location.assign('stock.html?id=' + id);
});

$('#change-manual').on('click',function(){
	var new_threshold = $('#new-threshold').val();
	alasql('UPDATE stock SET threshold = ? WHERE id=?',[new_threshold,id]);
	window.location.reload(true);
});

function datediff(d1,d2) {
	 var oneday = 86400000;
	 return (d2.getTime() - d1.getTime()) / oneday;
}

$('.set-threshold-auto').on('click',function(){
	var leadtime = alasql('SELECT * FROM item JOIN stock ON item.id = stock.item WHERE stock.id=?',[id])[0].leadtime;
	var rows = alasql('SELECT * FROM trans WHERE stock = ? AND qty<0 ORDER BY date', [ id ]);
	var per_day_sales;
	var extra = 10;
	if(rows.length==0){
		per_day_sales = 5;
	}else{
		var start_date = new Date(rows[0].date);
		var end_date = new Date(rows[rows.length-1].date);
		var totalSales = 0;
		for(var i=0;i<rows.length;i++){
			totalSales += rows[i].qty;
		}
		var diff = datediff(start_date,end_date);
		if(diff!=0){
			per_day_sales = -totalSales/diff;
		}else{
			per_day_sales = 5;
		}
	}
	var threshold = Math.round(leadtime * per_day_sales) + extra;
	if(window.confirm("Suggested threshold value is " + threshold + ". Do you want to change it?")){
		alasql('UPDATE stock SET threshold=? WHERE id=?',[threshold,id]);
		window.location.reload(true);
	}
});

var chart;
var chartData = [];
var chartCursor;

AmCharts.ready(function () {
    // generate some data first
    generateChartData();

    // SERIAL CHART
    chart = new AmCharts.AmSerialChart();

    chart.dataProvider = chartData;
    chart.categoryField = "date";
    chart.balloon.bulletSize = 5;

    // listen for "dataUpdated" event (fired when chart is rendered) and call zoomChart method when it happens
    chart.addListener("dataUpdated", zoomChart);

    // AXES
    // category
    var categoryAxis = chart.categoryAxis;
    categoryAxis.parseDates = true; // as our data is date-based, we set parseDates to true
    categoryAxis.minPeriod = "DD"; // our data is daily, so we set minPeriod to DD
    categoryAxis.dashLength = 1;
    categoryAxis.minorGridEnabled = true;
    categoryAxis.twoLineMode = true;
    categoryAxis.dateFormats = [{
        period: 'fff',
        format: 'JJ:NN:SS'
    }, {
        period: 'ss',
        format: 'JJ:NN:SS'
    }, {
        period: 'mm',
        format: 'JJ:NN'
    }, {
        period: 'hh',
        format: 'JJ:NN'
    }, {
        period: 'DD',
        format: 'DD'
    }, {
        period: 'WW',
        format: 'DD'
    }, {
        period: 'MM',
        format: 'MMM'
    }, {
        period: 'YYYY',
        format: 'YYYY'
    }];

    categoryAxis.axisColor = "#DADADA";

    // value
    var valueAxis = new AmCharts.ValueAxis();
    valueAxis.axisAlpha = 0;
    valueAxis.dashLength = 1;
    chart.addValueAxis(valueAxis);

    // GRAPH
    var graph = new AmCharts.AmGraph();
    graph.title = "red line";
    graph.valueField = "visits";
    graph.bullet = "round";
    graph.bulletBorderColor = "#FFFFFF";
    graph.bulletBorderThickness = 2;
    graph.bulletBorderAlpha = 1;
    graph.lineThickness = 2;
    graph.lineColor = "#5fb503";
    graph.negativeLineColor = "#efcc26";
    graph.hideBulletsCount = 50; // this makes the chart to hide bullets when there are more than 50 series in selection
    chart.addGraph(graph);

    // CURSOR
    chartCursor = new AmCharts.ChartCursor();
    chartCursor.cursorPosition = "mouse";
    chartCursor.pan = true; // set it to fals if you want the cursor to work in "select" mode
    chart.addChartCursor(chartCursor);

    // SCROLLBAR
    var chartScrollbar = new AmCharts.ChartScrollbar();
    chart.addChartScrollbar(chartScrollbar);

    chart.creditsPosition = "bottom-right";

    // WRITE
    chart.write("chartdiv");
});

// generate some random data, quite different range
function generateChartData() {
	
    for (var i = 0; i < rows.length; i++) {
        // we create date objects here. In your data, you can have date strings
        // and then set format of your dates using chart.dataDateFormat property,
        // however when possible, use date objects, as this will speed up chart rendering.
        var newDate = rows[i].date; 
        var value = rows[i].balance;

        chartData.push({
            date: newDate,
            visits: value
        });
    }
}

// this method is called when chart is first inited as we listen for "dataUpdated" event
function zoomChart() {
    // different zoom methods can be used - zoomToIndexes, zoomToDates, zoomToCategoryValues
    chart.zoomToIndexes(chartData.length - 40, chartData.length - 1);
}