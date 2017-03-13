var user = window.sessionStorage.getItem('user');
if(user != "superuser" && user != "porter"){
	window.location.assign("index.html");
}

if(user == "porter"){
	$('#side-bar').find('li').each(function(){
		if(!$(this).hasClass('active') && $(this).index()!=3){
			$(this).css('display','none');
		}
	});
}

var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	var option4 = $('<option>');
	var option5 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.name);
	option4.attr('value',row.id);
	option4.text(row.name);
	option5.attr('value',row.id);
	option5.text(row.name);
	$('select[name="q1"]').append(option1);
	$('select[name="c1"]').append(option4);
	$('select[name="r1"]').append(option5);
}

//get search params
var q1 = parseInt($.url().param('q1') || '1');
$('select[name="q1"]').val(q1);
var q3 = $.url().param('q3') || '';
$('input[name="q3"]').val(q3);

$('select[name="r4"]').append('<option value="damaged">Damaged in transit</option>');
$('select[name="r4"]').append('<option value="returned">Returned by customer</option>');

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

var rows = alasql('SELECT id,code FROM item;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option2 = $('<option>');
	var option3 = $('<option>');
	option2.attr('value', row.id);
	option2.text(row.code);
	option3.attr('value', row.id);
	option3.text(row.code);
	$('select[name="c2"]').append(option2);
	$('select[name="r2"]').append(option3);
}


if(q1 && q3){
	var rows = alasql('SELECT shelves.shelfnumber, whouse.name, shelves.productcode, shelves.quantity \
			FROM shelves \
			JOIN whouse ON shelves.warehouseid = whouse.id \
			WHERE whouse.id = ? AND shelves.productcode LIKE ? ORDER BY shelfnumber,productcode', [q1, '%' + q3 + '%'] );	
}else if(q1 && !q3){
	var rows = alasql('SELECT shelves.shelfnumber, whouse.name, shelves.productcode, shelves.quantity \
			FROM shelves \
			JOIN whouse ON shelves.warehouseid = whouse.id \
			WHERE whouse.id = ? ORDER BY shelfnumber,productcode', [q1] );	
	
}else if(!q1 && q3){
	var rows = alasql('SELECT shelves.shelfnumber, whouse.name, shelves.productcode, shelves.quantity \
			FROM shelves \
			JOIN whouse ON shelves.warehouseid = whouse.id \
			WHERE shelves.productcode LIKE ? ORDER BY shelfnumber,productcode', ['%' + q3 + '%'] );		
}else{
	var rows = alasql('SELECT shelves.shelfnumber, whouse.name, shelves.productcode, shelves.quantity \
			FROM shelves \
			JOIN whouse ON shelves.warehouseid = whouse.id ORDER BY shelfnumber,productcode');
}

var tbody = $('#tbody-shelves');
var numberOfEntriesPerPage = Math.min(10,rows.length); //default value
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
	tr.append('<td>' + row.shelfnumber + '</td>');
	tr.append('<td>' + row.productcode + '</td>');
	tr.append('<td>' + row.quantity + '</td>');
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
		tr.append('<td>' + row.shelfnumber + '</td>');
		tr.append('<td>' + row.name + '</td>');
		tr.append('<td>' + row.productcode + '</td>');
		tr.append('<td>' + row.quantity + '</td>');
	}
}

function getCurrDate(){
	var d = new Date();
	var currDate = d.getDate();
	var currMonth = d.getMonth();
	var currYear = d.getFullYear();
	currMonth++;
	if(currDate<10){
		currDate = "0" + currDate.toString();
	}
	if(currMonth<10){
		currMonth = "0" + currMonth.toString();
	}
	var date = currYear + "-" + currMonth + "-" + currDate;
	return date;
}

//handle issue functionality
$('#form-handle-issue select').change(function(){
	var r2 = parseInt($('select[name="r2"]').val());
	if(q1==0 || r2==0)
		return;
	var r3 = alasql('SELECT balance FROM stock WHERE whouse=? AND item=?',[q1,r2]);
	if(r3.length == 0){
		$('input[name="r3"]').val(0);
	}else{
		$('input[name="r3"]').val(r3[0].balance);
	}
})


//stock count functionality
$('#form-handle-count select').change(function(){
	var c2 = parseInt($('select[name="c2"]').val());
	if(q1==0 || c2==0)
		return;
	var c3 = alasql('SELECT balance FROM stock WHERE whouse=? AND item=?',[q1,c2]);
	if(c3.length == 0){
		$('input[name="c3"]').val(0);
	}else{
		$('input[name="c3"]').val(c3[0].balance);
	}
})

function findValue(attr,id){
	switch(attr){
		case 'price':
					return alasql('SELECT item.price \
									FROM item \
									JOIN stock ON item.id = stock.item \
									WHERE stock.id=?',[parseInt(id)])[0].price;
		case 'whouse':
					return alasql('SELECT whouse FROM stock WHERE id=?',[parseInt(id)])[0].whouse;
		case 'code':
					return alasql('SELECT item.code \
									FROM item \
									JOIN stock ON stock.item = item.id \
									WHERE stock.id = ?', [parseInt(id)])[0].code;
	}
}

//excess handler, called when there is an excess of quantity, for shelf management
function handleExcess(origBalance,newBalance,id,qty){
	if(origBalance<=200){
		var shelfId = alasql('SELECT * FROM shelves WHERE warehouseid = ? AND productcode = ? ',[findValue('whouse',id),findValue('code',id)])[0].id;
		alasql('UPDATE shelves SET quantity = ? WHERE warehouseid = ? AND productcode = ? ',[ newBalance, findValue('whouse',id), findValue('code',id) ] );
	}else{
		var rows = alasql('SELECT * FROM shelves WHERE warehouseid = ? AND productcode = ? ORDER BY id DESC',[ findValue('whouse',id), findValue('code',id) ]);
		for(var i=0;i<rows.length && qty>0;i++){
			if(rows[i].quantity>qty){
				alasql('UPDATE shelves SET quantity = ? WHERE id = ? AND warehouseid = ? AND productcode = ? ',[ rows[i].quantity - qty, rows[i].id, rows[i].warehouseid , rows[i].productcode ] );
			}else{
				alasql('DELETE FROM shelves WHERE id = ? AND warehouseid = ? AND productcode = ?', [rows[i].id,rows[i].warehouseid, rows[i].productcode]);
			}
			qty -= rows[i].quantity;
		}
	}	
}

//deficit handler, called when there is a deficit of quantity, for shelf management
function handleDeficit(remaining,id){
	var productCode = findValue('code',id);
	var whouseId = parseInt(findValue('whouse',id));
	var shelf_numbers = alasql('SELECT * FROM shelves WHERE warehouseid=? AND productcode=?',[whouseId,productCode]);
	for(var i=0;i<shelf_numbers.length && remaining>0;i++){
		var total = alasql('SELECT SUM(quantity) AS total FROM shelves WHERE shelfnumber=?',[shelf_numbers[i].shelfnumber])[0].total;
		var deficit = 200-total;
		if(deficit==0)
			continue;
		if(deficit>=remaining){
			var elems = alasql('SELECT * FROM shelves WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[shelf_numbers[i].shelfnumber,whouseId,productCode]);
			if(elems.length==0){
				var shelfId = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
				alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelfId,shelf_numbers[i].shelfnumber,shelf_numbers[i].warehouseid,productCode, remaining]);
			}else{
				alasql('UPDATE shelves SET quantity=? WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[elems[0].quantity+remaining,shelf_numbers[i].shelfnumber,whouseId,productCode]);
			}
		}else{
			var elems = alasql('SELECT * FROM shelves WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[shelf_numbers[i].shelfnumber,whouseId,productCode]);
			if(elems.length==0){
				var shelfId = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
				alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelfId,shelf_numbers[i].shelfnumber,shelf_numbers[i].warehouseid,productCode, deficit]);
			}else{
				alasql('UPDATE shelves SET quantity=? WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[elems[0].quantity+deficit,shelf_numbers[i].shelfnumber,whouseId,productCode]);
			}
		}
		remaining -= deficit;		
	}
	var rows = alasql('SELECT * FROM shelves WHERE warehouseid=?',[whouseId] );
	for(var i=0;i<rows.length && remaining>0;i++){
		var total = alasql('SELECT SUM(quantity) AS total FROM shelves WHERE shelfnumber=?',[rows[i].shelfnumber])[0].total;
		var deficit = 200-total;
		if(deficit==0)
			continue;
		if(deficit>=remaining){
			var elems = alasql('SELECT * FROM shelves WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[rows[i].shelfnumber,whouseId,productCode]);
			if(elems.length==0){
				var shelfId = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
				alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelfId,rows[i].shelfnumber,rows[i].warehouseid,productCode, remaining]);
			}else{
				alasql('UPDATE shelves SET quantity=? WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[elems[0].quantity+remaining,rows[i].shelfnumber,whouseId,productCode]);
			}
		}else{
			var elems = alasql('SELECT * FROM shelves WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[rows[i].shelfnumber,whouseId,productCode]);
			if(elems.length==0){
				var shelfId = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
				alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelfId,rows[i].shelfnumber,rows[i].warehouseid,productCode, deficit]);
			}else{
				alasql('UPDATE shelves SET quantity=? WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[elems[0].quantity+deficit,rows[i].shelfnumber,whouseId,productCode]);
			}
		}
		remaining -= deficit;
	}
	if(remaining>0){
		alert("Not enough shelves in warehouse to hold current item.");
	}
	return remaining;
}

function handleCount(){
	var c2 = parseInt($('select[name="c2"]').val());
	if(c2==0){
		alert("No item selected.");
		window.location.reload(true);
	}
	var item = alasql('SELECT * FROM item WHERE id=?',[c2])[0].code;
	var c3 = parseInt($('input[name="c3"]').val());
	var c4 = parseInt($('input[name="c4"]').val());
	var report_id = alasql('SELECT MAX(id)+1 AS id FROM reports')[0].id;
	alasql('INSERT INTO reports VALUES(?,?,?,?,?,"pending")',[report_id,q1,c2,c4-c3,"discrepancy"]); //c1:whouseid, c2:itemid,c3:oldQty,c4:newQty
	var rows = alasql('SELECT id FROM stock WHERE whouse = ? AND item = ?', [q1,c2]);
	if(rows.length==0){
		var stock_id = alasql('SELECT MAX(id)+1 AS id FROM stock')[0].id;
		alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,c2,q1,50,0,0,0]);
		
	}else{
		var stock_id = rows[0].id;
	}
	var date = getCurrDate();
	var memo;
	if(c3<c4){
		memo = "Excess in quantity found";
	}else{
		memo = "Deficit in quantity found";
	}
	var qty = c4-c3;
	var rem = 0;
	if(c3<c4){
		rem = handleDeficit(qty,stock_id);
	}else{
		handleExcess(c3,c4,stock_id,c3-c4);
	}
	if(rem<=0){
		// add trans record
		var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
		alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty, c4, memo, "" ]);
	}else{
		// add trans record
		var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
		alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty - rem, c4 - rem, memo, "" ]);			
	}
	var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
	alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='reports.html'>Report for discrepancy in stock count for item - " + item + " added.</a>",0]);		
}


function handleIssue(){
	var r2 = parseInt($('select[name="r2"]').val());
	var item = alasql('SELECT * FROM item WHERE id=?',[r2])[0].code;		
	var r3 = parseInt($('input[name="r3"]').val());
	var r4 = $('select[name="r4"]').val(); //possible values: damaged,returned
	var r5 = parseInt($('input[name="r5"]').val());
	switch(r4){
		case 'damaged': if(r3>=r5){
							var report_id = alasql('SELECT MAX(id)+1 AS id FROM reports')[0].id;
							alasql('INSERT INTO reports VALUES(?,?,?,?,?,"pending")',[report_id,q1,r2,-r5,r4]);
							var rows = alasql('SELECT id FROM stock WHERE whouse = ? AND item = ?', [q1,r2]);
							var stock_id = rows[0].id;
							var date = getCurrDate();
							var memo = r4 + " in transit";
							var qty = -r5;
							handleExcess(r3,r3-r5,stock_id,qty);
							// add trans record
							var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
							alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty, r3-r5, memo, "" ]);
							var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
							alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='reports.html'>Report for damage of item - " + item + " added.</a>",0]);								
						}else{
							alert("Not enough quantity in stock.Recheck the values.");
							window.location.reload(true);
						}
						break;
		case 'returned':var report_id = alasql('SELECT MAX(id)+1 AS id FROM reports')[0].id;
						alasql('INSERT INTO reports VALUES(?,?,?,?,?,"pending")',[report_id,q1,r2,r5,r4]);
						var rows = alasql('SELECT id FROM stock WHERE whouse = ? AND item = ?', [q1,r2]);
						var stock_id;
						if(rows.length == 0){
							stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
							alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[ stock_id,r2,q1,50,r3+r5,0,0 ]);
						}else{
							stock_id = rows[0].id;
						}
						var date = getCurrDate();
						var memo = r4 + " by customer";
						var qty = r5;
						var rem = handleDeficit(qty,stock_id);
						if(rem<=0){
							// add trans record
							var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
							alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty, r3+r5, memo, "" ]);
						}else{
							// add trans record
							var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
							alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, qty-rem, r3+r5-rem, memo, "" ]);								
						}
						var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
						alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='reports.html'>Report for return of item - " + item + " added.</a>",0]);							
						break;
	}
}

$('select[name="r4"],select[name="r2"]').on('change',function(){
	var issue = $('select[name="r4"]').val();
	switch(issue){
	case 'damaged': $('select[name="r6"]').prop('disabled',false);
					$('select[name="r6"]').empty();
					$('select[name="r6"]').append('<option value="0">Choose one</option>');
					var r2 = parseInt($('select[name="r2"]').val());
					if(r2!=0){
						var code = alasql('SELECT * FROM item WHERE id=?',[r2])[0].code;
						var rows = alasql('SELECT * FROM shelves WHERE warehouseid=? AND productcode=?',[q1,code]);
						for(var i=0;i<rows.length;i++){
							var option1 = $('<option>');
							option1.attr('value', rows[i].shelfnumber);
							option1.text(rows[i].shelfnumber);
							$('select[name="r6"]').append(option1);
						}
					}
					break;
	case 'returned': $('select[name="r6"]').prop('disabled',true);
	default: break;
	}
});

$(".ok").on('click',function(){
	window.location.reload(true);
})