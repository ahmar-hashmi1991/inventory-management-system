var user = window.sessionStorage.getItem('user');
if(user != "superuser" && user != "porter"){
	window.location.assign("index.html");
}

if(user == "porter"){
	$('#side-bar').find('li').each(function(){
		if(!$(this).hasClass('active') && $(this).index()!=5){
			$(this).css('display','none');
		}
	});
}

var option1 = $('<option>');
var option2 = $('<option>');
option1.attr('value', 1);
option1.text("Inbound");
option2.attr('value', 2);
option2.text("Outbound");
$('select[name="o1"]').append(option1);
$('select[name="o1"]').append(option2);

var option3 = $('<option>');
var option4 = $('<option>');
var option5 = $('<option>');
var option6 = $('<option>');
var option7 = $('<option>');
var option8 = $('<option>');
option3.attr('value', 1);
option3.text("Pending");
option4.attr('value', 2);
option4.text("Storing");
option5.attr('value', 3);
option5.text("Stored");
option6.attr('value', 4);
option6.text("Retrieving");
option7.attr('value', 5);
option7.text("Retrieved");

$('select[name="o1"]').append(option1);
$('select[name="o1"]').append(option2);

$('select[name="o3"]').append(option3);
$('select[name="o3"]').append(option4);
$('select[name="o3"]').append(option5);
$('select[name="o3"]').append(option6);
$('select[name="o3"]').append(option7);

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
	$('select[name="o2"]').append(option1);
	$('select[name="c1"]').append(option4);
	$('select[name="r1"]').append(option5);
}

var o1 = parseInt($.url().param('o1') || '0');
$('select[name="o1"]').val(o1);
var o2 = parseInt($.url().param('o2') || '1');
$('select[name="o2"]').val(o2);
var o3 = parseInt($.url().param('o3') || '0');
$('select[name="o3"]').val(o3);

$('select[name="r4"]').append('<option value="lost">Lost in transit</option>');
$('select[name="r4"]').append('<option value="damaged">Damaged in transit</option>');
$('select[name="r4"]').append('<option value="returned">Returned by customer</option>');

$('select[name="o2"]').on('change',function(){
	$('#form1').trigger('submit');
});

var rows = alasql('SELECT * FROM notifications WHERE user=? AND flag=0 AND whouse=?',[user,o2]);
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
		alasql('UPDATE notifications SET flag=1 WHERE user=? AND whouse=?',[user,o2]);
	}else{
		alasql('UPDATE notifications SET flag=1 WHERE user=? AND id=? AND whouse=?',[user,id,o2]);
	}
	$('#notifications').empty();
	var rows = alasql('SELECT * FROM notifications WHERE user=? AND flag=0 AND whouse=?',[user,o2]);
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

function findType(id){
	if(id==1){
		return "Inbound";
	}else{
		return "Outbound";
	}
}

function findWhouseName(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].name;
}

function findStatus(id){
	switch(id){
	case 1: return "Pending";
	case 2: return "Storing";
	case 3: return "Stored";
	case 4: return "Retrieving";
	case 5: return "Retrieved";
	}
}
var sql = 'SELECT * FROM orders';

if(o1==0 && o2==0 && o3==0){
	sql += '';
}else if(o1==0 && o2==0 && o3!=0){
	sql += ' WHERE status="' + findStatus(o3) + '"';	
}else if(o1==0 && o2!=0 && o3==0){
	sql += ' WHERE whouse="' + findWhouseName(o2) + '"';	
}else if(o1==0 && o2!=0 && o3!=0){
	sql += ' WHERE whouse="' + findWhouseName(o2) + '" AND ';	
	sql += 'status="' + findStatus(o3) + '"';	
}else if(o1!=0 && o2==0 && o3==0){
	sql += ' WHERE type="' + findType(o1) + '"';	
}else if(o1!=0 && o2==0 && o3!=0){
	sql += ' WHERE type="' + findType(o1) + '" AND ';		
	sql += 'status="' + findStatus(o3) + '"';	
}else if(o1!=0 && o2!=0 && o3==0){
	sql += ' WHERE type="' + findType(o1) + '" AND ';		
	sql += 'whouse="' + findWhouseName(o2) + '"';	
}else{
	sql += ' WHERE type="' + findType(o1) + '" AND ';
	sql += 'whouse="' + findWhouseName(o2) + '" AND ';
	sql += 'status="' + findStatus(o3) + '"';
}

sql += ' ORDER BY type DESC, status ASC, estimatedDate ASC';

var orders = alasql(sql);
// build html table
var tbody = $('#tbody-orders');
for (var i = 0; i < orders.length; i++) {
	var order = orders[i];
	var tr = $('<tr class="clickable" id='+ order.id +'></tr>');
	tr.append('<td>' + order.id + '</td>');
	tr.append('<td>' + order.name + '</td>');
	tr.append('<td>' + order.address + '</td>');
	tr.append('<td>' + order.tel + '</td>');
	tr.append('<td>' + order.type + '</td>');
	tr.append('<td>' + order.estimatedDate + '</td>');
	if(order.status == "Not in stock"){
		tr.append('<td><span class="label label-danger">Not in stock</span></td>');
	}else if(order.status == "Pending"){
		tr.append('<td><span class="label label-danger">Pending</span></td>');
	}else if(order.status == "Storing"){
		tr.append('<td><span class="label label-warning">Storing</span></td>');		
	}else if(order.status == "Retrieving"){
		tr.append('<td><span class="label label-warning">Retrieving</span></td>');		
	}else{
		if(order.type == "Inbound"){
			tr.append('<td><span class="label label-success">Stored</span></td>');
		}else{
			tr.append('<td><span class="label label-success">Retrieved</span></td>');
		}
	}
	tr.appendTo(tbody);	
	$('.clickable').css('cursor', 'pointer').on('click', function() {
		var id = parseInt($(this).attr('id'));
		var order = alasql('SELECT * FROM orders WHERE id=?',[ id ])[0];
		handleOrderRequest(id,order);
	});
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

//excess handler shelf recommender, called when there is an excess of quantity, for shelf management
function handleExcessRS(origBalance,newBalance,id,qty){
    var htmlCode = '<div class="alert alert-success alert-dismissible" role="alert">\
		<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
	if(origBalance<=200){
		var shelfnumber = alasql('SELECT * FROM shelves WHERE warehouseid = ? AND productcode = ? ',[findValue('whouse',id),findValue('code',id)])[0].shelfnumber;
		$(htmlCode + 'Fetch '+ findValue('code',id) + ' from shelf number - ' + shelfnumber + '</div>').insertAfter('#order-list');
	}else{
		var rows = alasql('SELECT * FROM shelves WHERE warehouseid = ? AND productcode = ? ORDER BY id DESC',[ findValue('whouse',id), findValue('code',id) ]);
		for(var i=0;i<rows.length && qty>0;i++){
			qty -= rows[i].quantity;
			$(htmlCode + 'Fetch '+ findValue('code',id) + ' from shelf number - ' +rows[i].shelfnumber + '</div>').insertAfter('#order-list');
		}
	}	
}

//deficit handler, called when there is a deficit of quantity, for shelf management
function handleDeficit(remaining,id){
	var productCode = findValue('code',id);
	var whouseId = parseInt(findValue('whouse',id));
	var shelf_number = alasql('SELECT * FROM shelves WHERE warehouseid=? AND productcode=?',[whouseId,productCode])[0].shelfnumber;
	var total = alasql('SELECT SUM(quantity) AS total FROM shelves WHERE shelfnumber=?',[shelf_number])[0].total;
	var deficit = 200-total;
	if(deficit>0){
		if(deficit>=remaining){
			var elems = alasql('SELECT * FROM shelves WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[shelf_number,whouseId,productCode]);
			if(elems.length==0){
				var shelfId = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
				alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelfId,shelf_number,whouseId,productCode, remaining]);
			}else{
				alasql('UPDATE shelves SET quantity=? WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[elems[0].quantity+remaining,shelf_number,whouseId,productCode]);
			}
		}else{
			var elems = alasql('SELECT * FROM shelves WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[shelf_number,whouseId,productCode]);
			if(elems.length==0){
				var shelfId = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
				alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelfId,shelf_number,whouseId,productCode, deficit]);
			}else{
				alasql('UPDATE shelves SET quantity=? WHERE shelfnumber=? AND warehouseid=? AND productcode=?',[elems[0].quantity+deficit,shelf_number,whouseId,productCode]);
			}
		}
		remaining -= deficit;
	}
	var rows = alasql('SELECT * FROM shelves WHERE warehouseid=? AND shelfnumber != ?',[whouseId,shelf_number] );
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

//deficit handler shelf recommender, called when there is a deficit of quantity, for shelf management
function handleDeficitRS(remaining,id){
    var htmlCode = '<div class="alert alert-success alert-dismissible" role="alert">\
		<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>';
	var productCode = findValue('code',id);
	var whouseId = parseInt(findValue('whouse',id));
	var itemId = alasql('SELECT * FROM item WHERE code=?',[productCode])[0].id;
	var shelf_number = 4*(whouseId-1)+itemId;
	var total = alasql('SELECT SUM(quantity) AS total FROM shelves WHERE shelfnumber=?',[shelf_number])[0].total;
	var deficit = 200-total;
	if(deficit>0){
		$(htmlCode + 'Store '+ productCode + ' in shelf number - '+ shelf_number + '</div>').insertAfter('#order-list');
		remaining -= deficit;
	}
	var rows = alasql('SELECT * FROM shelves WHERE warehouseid=? AND shelfnumber != ?',[whouseId,shelf_number] );
	for(var i=0;i<rows.length && remaining>0;i++){
		var total = alasql('SELECT SUM(quantity) AS total FROM shelves WHERE shelfnumber=?',[rows[i].shelfnumber])[0].total;
		var deficit = 200-total;
		if(deficit==0)
			continue;
		$(htmlCode + 'Store '+ productCode + ' in shelf number - '+ rows[i].shelfnumber + '</div>').insertAfter('#order-list');
		remaining -= deficit;		
	}
	if(remaining>0){
		alert("Not enough shelves in warehouse to hold current item.");
	}
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

function updateShelvesLog(orderdetail,type){
	switch(type){
		case 'Outbound':
						var order_id = orderdetail.order_id;
						var stock_id = orderdetail.stock_id;
				    	var quantity = orderdetail.quantity;
				    	var currBalance = alasql('SELECT balance FROM stock WHERE id=?',[stock_id])[0].balance;
						var newBalance = currBalance - quantity;
						var committedOutgoing = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].committedOutgoing;
						alasql('UPDATE stock SET committedOutgoing=? WHERE id=?',[committedOutgoing-quantity,stock_id]);
						alasql('UPDATE stock SET balance = ? WHERE id = ?', [ newBalance, parseInt(stock_id) ]);
						var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
						var date = getCurrDate();
						var memo = "Sold";
						alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?);', [ trans_id, stock_id, date, -quantity, newBalance , memo, order_id ] );
						handleExcess(currBalance,newBalance,stock_id,quantity);
						break;
		case 'Inbound':	
						var order_id = orderdetail.order_id;	
						var stock_id = orderdetail.stock_id;
				    	var quantity = orderdetail.quantity;
				    	var currBalance = alasql('SELECT balance FROM stock WHERE id=?',[stock_id])[0].balance;
						var newBalance = currBalance + quantity;
						var expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
						alasql('UPDATE stock SET expectedIncoming=? WHERE id=?',[expectedIncoming-quantity,stock_id]);
						alasql('UPDATE stock SET balance = ? WHERE id = ?', [ newBalance, parseInt(stock_id) ]);
						var trans_id = alasql('SELECT MAX(id) + 1 as id FROM trans')[0].id;
						var date = getCurrDate();
						var memo = "Purchased";
						var rem = handleDeficit(quantity,stock_id);
						if(rem<=0){
							alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, quantity, newBalance, memo ,order_id ]);
						}else{
							alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?)', [ trans_id, stock_id, date, quantity-rem, newBalance-rem, memo ,order_id ]);
						}
	}
}

function recommendShelf(orderdetail,type){
	switch(type){
		case 'Outbound':
						var stock_id = orderdetail.stock_id;
				    	var quantity = orderdetail.quantity;
				    	var currBalance = alasql('SELECT balance FROM stock WHERE id=?',[stock_id])[0].balance;
						var newBalance = currBalance - quantity;
						if(newBalance<0){
							return -1;
						}						
						handleExcessRS(currBalance,newBalance,stock_id,quantity);
						break;
		case 'Inbound':	
						var stock_id = orderdetail.stock_id;
				    	var quantity = orderdetail.quantity;
						handleDeficitRS(quantity,stock_id);
	}
}

function handleOrderRequest(id,order){
	//console.log(order);
	$('#table-caption').html("Order ID: " + id +  "<br></br>Order Type: " + order.type);	
	var order_id = id;
	var rows = alasql('SELECT orderdetails.status,orderdetails.id, orders.type, whouse.name, item.code, kind.text, quantity, item.price \
						FROM orderdetails \
						JOIN orders ON orderdetails.order_id = orders.id \
						JOIN stock ON orderdetails.stock_id = stock.id \
						JOIN whouse ON stock.whouse = whouse.id \
						JOIN item ON stock.item = item.id \
						JOIN kind ON item.kind = kind.id \
						WHERE orderdetails.order_id=?',[order_id]);
	var items = $('#tbody-items');
	items.empty();
	for (var i = 0; i < rows.length; i++) {
		var row = rows[i];
		var tr = $('<tr id='+ i +'></tr>');
		tr.append('<td>' + row.code + '</td>');
		tr.append('<td>' + row.text + '</td>');
		tr.append('<td>' + row.quantity + '</td>');
		if(row.status=="Pending"){
			tr.append('<td><button type="button" id=' + row.id + ' class="status btn btn-danger btn-xs">' + row.status +'</button></td>');
		}else if(row.status=="Storing" || row.status=="Retrieving"){
			tr.append('<td><button type="button" id=' + row.id + ' class="status btn btn-warning btn-xs">' + row.status +'</button></td>');			
		}else if(row.status =="Not in stock"){
			tr.append('<td><button type="button" id=' + row.id + ' class="status nis btn btn-danger btn-xs">' + row.status +'</button></td>');	
		}else{
			tr.append('<td><span class="label label-success">' + row.status +'</span></td>')
		}
		tr.append('<td><button type="button" id=' + row.id + ' class="undo btn btn-danger btn-xs">Undo</button></td>');
		tr.find('.status').on('click',function(){
			var id = parseInt($(this).attr('id'));
			var orderdetail = alasql('SELECT * FROM orderdetails WHERE id=?',[id])[0];
			var type = alasql('SELECT * FROM orders WHERE id=?',[orderdetail.order_id])[0].type;
			switch(orderdetail.status){
				case 'Pending':
				case 'Not in stock': var x = recommendShelf(orderdetail,type);
									 if(x==-1){
									 	 orderdetail.status = "Not in stock";												
										 $(this).replaceWith('<button type="button" class="nis btn btn-danger btn-xs">' + orderdetail.status +'</button>');
										 alasql('UPDATE orderdetails SET status=? WHERE id=?',["Not in stock",id]);	
									 }else{
										 if(type == "Inbound"){
		  									 $(this).removeClass('btn-danger').addClass('btn-warning');
											 $(this).text("Storing");
										 	 alasql('UPDATE orderdetails SET status=? WHERE id=?',["Storing",id]);	
											 orderdetail.status = "Storing";
										 }else{
											 $(this).removeClass('btn-danger').addClass('btn-warning');
											 $(this).text("Retrieving");
											 alasql('UPDATE orderdetails SET status=? WHERE id=?',["Retrieving",id]);	
											 orderdetail.status = "Retrieving";							
										 }
									 }
									 break;
				case 'Storing':
				case 'Retrieving':	var oldQty = alasql('SELECT * FROM stock WHERE id=?',[orderdetail.stock_id])[0].balance;
									updateShelvesLog(orderdetail,type);
									if(type == "Inbound"){
										$(this).replaceWith('<span class="label label-success">Stored</span>');
										alasql('UPDATE orderdetails SET status=? WHERE id=?',["Stored",id]);	
										orderdetail.status = "Stored";
										var newQty = alasql('SELECT * FROM stock WHERE id=?',[orderdetail.stock_id])[0].balance;
										var threshold = alasql('SELECT * FROM stock WHERE id=?',[orderdetail.stock_id])[0].threshold;
										var code = alasql('SELECT * FROM orderdetails \
															JOIN stock ON orderdetails.stock_id = stock.id \
															JOIN item ON stock.item = item.id \
															WHERE stock.id=?',[orderdetail.stock_id])[0].code;
										var orders = alasql('SELECT * FROM orders WHERE orders.type="Outbound" AND orders.status = "Not in stock"');
										for(var i=0;i<orders.length;i++){
											var orderdetails = alasql('SELECT * FROM orderdetails WHERE order_id=?',[orders[i].id]);
											var flag = 0;
											for(var j=0;j<orderdetails.length;j++){
												var balance = alasql('SELECT * FROM stock WHERE id=?',[orderdetails[j].stock_id])[0].balance;
												if(balance<orderdetails[j].quantity){
													flag = 1;
													break;
												}
											}
											if(flag == 0){
												var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
												var message = "<a>Order with id - " + orders[i].id + " ready to be processed.</a>";
												alasql('UPDATE orders SET status="Pending" WHERE id=?',[orders[i].id]);
												var row = alasql('SELECT * FROM notifications WHERE whouse=? AND user=? AND notification=?',[o2,'porter',message]);
												if(row.length==0){
													alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,o2,'porter',message,0]);												
												}
												var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
												var row = alasql('SELECT * FROM notifications WHERE whouse=? AND user=? AND notification=?',[o2,'superuser',message]);
												if(row.length==0){
													alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,o2,'superuser',message,0]);
												}
											}
										}
									}else{
										$(this).replaceWith('<span class="label label-success">Retrieved</span>');
										alasql('UPDATE orderdetails SET status=? WHERE id=?',["Retrieved",id]);								
										orderdetail.status = "Retrieved";		
									}
			}		

			var order_id = orderdetail.order_id;
			var orderdetails = alasql('SELECT * FROM orderdetails WHERE order_id=?',[order_id]);

			var flag = 0;
			for(var i=0;i<orderdetails.length;i++){
				if(orderdetails[i].status!="Pending" && orderdetails[i].status!="Not in stock"){
					flag=1;
					break;
				}
			}
			if(flag == 1){
				var flag1 = 0;
				for(var i=0;i<orderdetails.length;i++){
					if(orderdetails[i].status=="Storing" || orderdetails[i].status=="Retrieving" || orderdetails[i].status=="Pending" || orderdetails[i].status=="Not in stock"){
						flag1=1;
						break;
					}
				}
				if(flag1==0){
					if(type == "Inbound"){
						$('#tbody-orders tr#' + order_id + ' td').eq(6).replaceWith('<td><span class="label label-success">Stored</span></td>');
						alasql('UPDATE orders SET status=? WHERE id=?',["Stored",order_id]);
						var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
						alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,o2,'purchaseteam',"<a>Inbound order with order id - " + order_id + " stored in warehouse.</a>",0]);
						var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
						alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,o2,'superuser',"<a>Inbound order with order id - " + order_id + " stored in warehouse.</a>",0]);						
					}else{
						$('#tbody-orders tr#' + order_id + ' td').eq(6).replaceWith('<td><span class="label label-success">Retrieved</span></td>');
						alasql('UPDATE orders SET status=? WHERE id=?',["Retrieved",order_id]);
						var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
						alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,o2,'salesteam',"<a>Outbound order with order id - " + order_id + " shipped from warehouse.</a>",0]);
						var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
						alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,o2,'superuser',"<a>Outbound order with order id - " + order_id + " shipped from warehouse.</a>",0]);
					}
				}else{
					if(type == "Inbound"){
						$('#tbody-orders tr#' + order_id + ' td').eq(6).replaceWith('<td><span class="label label-warning">Storing</span></td>');
						alasql('UPDATE orders SET status=? WHERE id=?',["Storing",order_id]);
					}else{
						$('#tbody-orders tr#' + order_id + ' td').eq(6).replaceWith('<td><span class="label label-warning">Retrieving</span></td>');
						alasql('UPDATE orders SET status=? WHERE id=?',["Retrieving",order_id]);
					}
				}
			}			
		});
		tr.find('.undo').on('click',function(){
			var id = parseInt($(this).attr('id'));
			var orderdetail = alasql('SELECT * FROM orderdetails WHERE id=?',[id])[0];
			$('.status').removeClass('btn-warning').addClass('btn-danger');
			$('.status').text("Pending");
			alasql('UPDATE orderdetails SET status=? WHERE id=?',["Pending",id]);	
			orderdetail.status = "Pending";
		});
		tr.find('.nis').on('click',function(){
			handleOrderRequest(id,order);
		});
		tr.appendTo(items);		
	}
	$('#item-list').show();
}