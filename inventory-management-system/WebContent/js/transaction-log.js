var user = window.sessionStorage.getItem('user');
if(user != "superuser"){
	window.location.assign("index.html");
}

var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.name);
	$('select[name="q1"]').append(option);
}

var rows = alasql('SELECT * FROM kind;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option = $('<option>');
	option.attr('value', row.id);
	option.text(row.text);
	$('select[name="q2"]').append(option);
}

//get search params
var q1 = parseInt($.url().param('q1') || '1');
$('select[name="q1"]').val(q1);
var q2 = $.url().param('q2') || '';
$('select[name="q2"]').val(q2);
var q3 = $.url().param('q3') || '';
$('input[name="q3"]').val(q3);

$('select[name="q1"]').on('change',function(){
	$('#form1').trigger('submit');
});

var rows = alasql('SELECT * FROM notifications WHERE user=? AND flag=0 AND whouse=?',[user,q1]);
for(var i=0;i<rows.length;i++){
	$('#notifications').append('<li id="' + rows[i].id +'">' + rows[i].notification + '</li>');
	$('#notifications').append('<li role="separator" class="divider"></li>')
}
if(rows.length == 0){
	$('#notifications').append('<li><a>There are no unread messages.</a></li>')	
}else{
	$('#notifications').append('<li id="-1"><a>Finished reading all messages.</a></li>');		
}

$('#count').text(rows.length);

$('#notifications').on('click','li',function(){
	var id = parseInt($(this).attr('id'));
	if(id==-1){
		alasql('UPDATE notifications SET flag=1 WHERE user=? AND whouse=?',[user,q1]);
	}else{
		alasql('UPDATE notifications SET flag=1 WHERE user=? AND id=? AND whouse=?',[user,id,q1]);
	}
	$('#notifications').empty();
	var rows = alasql('SELECT * FROM notifications WHERE user=? AND flag=0 AND whouse=?',[user,q1]);
	for(var i=0;i<rows.length;i++){
		$('#notifications').append('<li id="' + rows[i].id +'"><a>' + rows[i].notification + '</a></li>');
		$('#notifications').append('<li role="separator" class="divider"></li>')
	}
	if(rows.length == 0){
		$('#notifications').append('<li><a>There are no unread messages.</a></li>')	
	}else{
		$('#notifications').append('<li id="-1"><a>Finished reading all messages.</a></li>');		
	}
	$('#count').text(rows.length);	
})

//build sql
var sql = 'SELECT trans.date, whouse.name, kind.text, item.detail, trans.qty, trans.memo\
			FROM trans \
			JOIN stock ON trans.stock = stock.id \
			JOIN item ON stock.item = item.id \
			JOIN kind ON item.kind = kind.id \
			JOIN whouse ON whouse.id = stock.whouse \
			WHERE whouse.id = ? AND item.detail LIKE ?';

if(q2!=0 && q2!=""){
	sql += ' AND (';
	for(var i=0;i<q2.length-1;i++){
		sql += 'kind.id = ' + q2[i] + ' OR ';
	}
	sql += 'kind.id = ' + q2[q2.length-1] + ')';
}

// send query
var rows = alasql(sql, [ q1, '%' + q3 + '%' ]);

$('th').click(function(){
    var table = $(this).parents('table').eq(0)
    var rows = table.find('tr:gt(0)').toArray().sort(comparer($(this).index()))
    this.asc = !this.asc
    if (!this.asc)
    	rows = rows.reverse()
    for (var i = 0; i < rows.length; i++)
    	table.append(rows[i])
})

function comparer(index) {
	return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index)
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB,'en-US-u-kf-lower');
    }
}

function getCellValue(row, index){ 
	return $(row).children('td').eq(index).html();
}

var tbody = $('#tbody-transs');
var numberOfEntriesPerPage = 10; //default value
var totalNumberOfEntries = rows.length;
var numberOfPages = Math.ceil(totalNumberOfEntries/numberOfEntriesPerPage);

for(var i=1;i<=Math.min(5,numberOfPages);i++){
	$('<li><a href="#" onclick="displaySelected(' + i + ');">'+ i +'</a></li>').insertBefore('#marker');
}

var currWindowStart = 1;	
var currWindowEnd = Math.min(5,numberOfPages);
for(var j=0;j<numberOfEntriesPerPage;j++){
	var row = rows[j];
	var tr = $('<tr id ="' + j + '">').appendTo(tbody);
	tr.append('<td>' + row.date + '</td>');
	tr.append('<td>' + row.text + '</td>');
	tr.append('<td>' + row.detail +'</td>');
	tr.append('<td>' + row.qty + '</td>');
	tr.append('<td>' + row.memo + '</td>');		
}	
$('input[name="entriescount"]').on('change',function(){
	handleChange();
})
function handleChange(){
	for(var i=Math.min(5,numberOfPages);i>=1;i--){
		$('ul.pagination li').eq(i).remove();
	}
	numberOfEntriesPerPage = $('input[name="entriescount"]').val();
	totalNumberOfEntries = rows.length;
	numberOfPages = Math.ceil(totalNumberOfEntries/numberOfEntriesPerPage);

	for(var i=1;i<=Math.min(5,numberOfPages);i++){
		$('<li><a href="#" onclick="displaySelected(' + i + ');">'+ i +'</a></li>').insertBefore('#marker');
	}
	currWindowStart = 1;	
	currWindowEnd = Math.min(5,numberOfPages);
}

function goToPrevPage(){
	if(currWindowStart == 1){
		return;
	}else{
		var tr = $('ul.pagination li');		
		for(var i=1;i<=5;i++){
			var pageNumber = parseInt(tr.eq(i).text());
			var arg = parseInt(pageNumber-1);
			tr.eq(i).html('<a href="#" onclick="displaySelected(' + arg + ');">'+ arg +'</a>');
		}
		currWindowStart--;
		currWindowEnd--;
	}
}

function goToNextPage(){
	if(currWindowEnd == numberOfPages){
		return;
	}else{
		var tr = $('ul.pagination li');	
		for(var i=1;i<=5 ;i++){
			var pageNumber = parseInt(tr.eq(i).text());
			var arg = parseInt(pageNumber+1);
			tr.eq(i).html('<a href="#" onclick="displaySelected(' + arg + ');">'+ arg +'</a>');
		}
		currWindowStart++;
		currWindowEnd++;
	}
}

function displaySelected(pageNumber){
	tbody.empty();
	for(var j=0;j<numberOfEntriesPerPage;j++){
		var i = (pageNumber-1)*numberOfEntriesPerPage+j;
		if(i>=rows.length)
			break;
		var row = rows[i];
		var tr = $('<tr id ="' + j + '">').appendTo(tbody);
		tr.append('<td>' + row.date + '</td>');
		tr.append('<td>' + row.name + '</td>');
		tr.append('<td>' + row.text + '</td>');
		tr.append('<td>' + row.detail +'</td>');
		tr.append('<td>' + row.qty + '</td>');
		tr.append('<td>' + row.memo + '</td>');		
	}
}
