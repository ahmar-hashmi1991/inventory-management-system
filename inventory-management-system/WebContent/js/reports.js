var user = window.sessionStorage.getItem('user');
if(user != "superuser"){
	window.location.assign("index.html");
}

var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.name);
	$('select[name="q1"]').append(option1);
}

// get search params
var q1 = parseInt($.url().param('q1') || '1');
$('select[name="q1"]').val(q1);

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

var rows = alasql('SELECT reports.*,item.code,item.maker,item.detail,kind.text FROM reports \
					JOIN item ON reports.itemid = item.id \
					JOIN kind ON item.kind = kind.id WHERE reports.whouseid=?',[q1]);

var tbody = $('#report-items');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var tr = $('<tr id="' + row.id + '"></tr>');
	tr.append('<td>' + row.text + '</td>');
	tr.append('<td>' + row.code + '</td>');
	tr.append('<td>' + row.maker + '</td>');
	tr.append('<td>' + row.detail + '</td>');
	tr.append('<td>' + row.quantity + '</td>');
	tr.append('<td>' + row.issue + '</td>');
	if(row.status == "pending"){
		tr.append('<td><button type="button" class="btn btn-warning btn-sm solve" id=' + row.id +'>Solve</button></td>');
	}else{
		tr.append('<td><button type="button" class="btn btn-warning btn-sm solve" disabled="true" id=' + row.id +'>Solve</button></td>');		
	}
	tr.appendTo(tbody);
}

tbody.on('click','.solve',function(){
	var id = parseInt($(this).attr('id'));
	var row = alasql('SELECT * FROM reports WHERE id=?',[id])[0];
	var issue = row.issue;
	var whouseId = row.whouseid;
	var itemId = row.itemid; 
	var difference = row.quantity;
	var oldQty = alasql('SELECT * FROM stock WHERE whouse=? AND item=?',[whouseId,itemId])[0].balance;
	var newQty = oldQty + difference;
	switch(issue){
		case 'damaged': if(window.confirm("Are the damaged items repairable?")){
							var rows = alasql('SELECT id FROM stock WHERE whouse = ? AND item = ?', [whouseId,itemId]);
							var stock_id = rows[0].id;
							var qty = oldQty - newQty;
							handleExcess(newQty,oldQty,stock_id,qty);
							alert("Item successfully repaired and added to stock");
						}else{
							alasql('UPDATE stock SET balance=? WHERE whouse=? AND item=?', [newQty,whouseId,itemId]);
							alert("Damaged item removed from inventory.");
						}
						break;
		case 'discrepancy': alasql('UPDATE stock SET balance=? WHERE whouse=? AND item=?', [newQty,whouseId,itemId]);
							alert("Stock count updated.");
							break;
		case 'returned':if(window.confirm("Are the returned items reusable or not?")){
							alasql('UPDATE stock SET balance=? WHERE whouse=? AND item=?', [newQty,whouseId,itemId]);
							alert("Returned items added to stock");
						}else{
							var rows = alasql('SELECT id FROM stock WHERE whouse = ? AND item = ?', [whouseId,itemId]);
							var stock_id;
							if(rows.length == 0){
								stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
								alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[ stock_id,itemId,whouseId,50,newQty,0,0 ]);
							}else{
								stock_id = rows[0].id;
							}
							var qty = newQty-oldQty;
							handleExcess(newQty,oldQty,stock_id,qty);							
							alert("Returned items discarded.");
						}
						break;
	}
	alasql('UPDATE reports SET status="solved" WHERE id=?',[id]);
	window.location.reload(true);
});
