var user = window.sessionStorage.getItem('user');
if(user != "superuser" && user != "purchaseteam"){
	window.location.assign("index.html");
} 

if(user == "purchaseteam"){
	$('#side-bar').find('li').each(function(){
		if(!$(this).hasClass('active')){
			$(this).css('display','none');
		}
	});
}

// options: warehouses and items
var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');	
	option1.attr('value', row.id);
	option1.text(row.name);	
	$('select[name="q1"]').append(option1);
}

var rows = alasql('SELECT id,code FROM item;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.code);
	$('select[name="c1"]').append(option1);
}

var rows = alasql('SELECT * FROM kind;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.text);
	$('select[name="q2"]').append(option1);
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

// build sql
var sql = 'SELECT stock.id, whouse.name, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, item.unit, stock.threshold, stock.expectedIncoming, stock.committedOutgoing \
	FROM stock \
	JOIN whouse ON whouse.id = stock.whouse \
	JOIN item ON item.id = stock.item \
	JOIN kind ON kind.id = item.kind \
	WHERE whouse.id = ? AND item.code LIKE ?';

if(q2!=0 && q2!=""){
	sql += ' AND (';
	for(var i=0;i<q2.length-1;i++){
		sql += 'kind.id = ' + q2[i] + ' OR ';
	}
	sql += 'kind.id = ' + q2[q2.length-1] + ')';
}

sql += 'ORDER BY whouse.name DESC ,kind.text ASC, item.code ASC';
// send query
var stocks = alasql(sql, [ q1, '%' + q3 + '%' ]);

// build html table
var tbody = $('#tbody-stocks');
for (var i = 0; i < stocks.length; i++) {
	var stock = stocks[i];
	var net_stock = stock.balance + stock.expectedIncoming - stock.committedOutgoing;
	var tr = $('<tr id="' + stock.id + '" class="stk" data-href="stock.html?id=' + stock.id + '"></tr>');
	tr.append('<td>' + stock.text + '</td>');
	tr.append('<td>' + stock.code + '</td>');
	tr.append('<td>' + stock.maker + '</td>');
	tr.append('<td>' + stock.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(stock.price) + '</td>');
	tr.append('<td style="text-align: right;">' + stock.balance + '</td>');
	tr.append('<td>' + stock.expectedIncoming + '</td>');
	tr.append('<td>' + stock.committedOutgoing + '</td>');
	tr.append('<td><span class="label label-danger">' + net_stock + '</span></td>');
	if(net_stock==0){
		tr.append('<td><span class="label label-danger">Out of stock</span></td>');		
	}else if(net_stock < stock.threshold){
		tr.append('<td><span class="label label-warning">Understock</span></td>');		
	}else{
		tr.append('<td><span class="label label-success">In stock</span></td>');		
	}
	tr.appendTo(tbody);
}

var max = alasql('SELECT MAX(order_id) AS order_id FROM purchasetemplateorders')[0].order_id;
for(var i=1;i<=max;i++){
	$('#accordion').append('<h3>Order ' + i +'</h3>'
				   + '<div id="template-order-' + i +'">' +
					'<table id="template-stock-list-' + i + '" class="table table-hover">' +
						'<thead>' +
							'<tr>' +
								'<th>Classification</th>' +
								'<th>Code</th>' +
								'<th>Maker</th>' +
								'<th>Detail</th>' +
								'<th>Price</th>' +
								'<th>Quantity</th>' +
							'</tr>' +
						'</thead>' +
						'<tbody id="tbody-template-stocks-' + i +'"></tbody>' +
					'</table>' +
				  '</div>');
}

var rows = alasql('SELECT * FROM purchasetemplateorders \
					JOIN item ON purchasetemplateorders.item_id = item.id \
					JOIN kind ON item.kind = kind.id');

for(var i=0;i<rows.length;i++){
	var row = rows[i];
	var tr = $('<tr id="' + i + '"></tr>');
	tr.append('<td>' + row.text + '</td>');
	tr.append('<td>' + row.code + '</td>');
	tr.append('<td>' + row.maker + '</td>');
	tr.append('<td>' + row.detail + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(row.price) + '</td>');
	tr.append('<td style="text-align: right;">' + numberWithCommas(row.quantity) + '</td>');
	tr.appendTo($('#tbody-template-stocks-'+row.order_id));
}

function findVal(attr,id){
	switch(attr){
	case 'text':
				return alasql('SELECT text \
						FROM kind \
						JOIN item ON kind.id = item.kind \
						WHERE item.id = ?',[ id ])[0].text;
	case 'detail':
				return alasql('SELECT detail \
							FROM item \
							WHERE item.id = ?',[ id ])[0].detail;
	case 'price':
				return alasql('SELECT price \
							FROM item \
							WHERE item.id = ?',[ id ])[0].price;
	}
}

var pbody_top_purchased = $('#top-purchased .panel-body');

var rows = alasql('SELECT item.id,ABS(SUM(orderdetails.quantity)) AS total_qty \
					FROM orderdetails \
					JOIN orders ON orderdetails.order_id = orders.id \
					JOIN stock ON orderdetails.stock_id = stock.id \
					JOIN item ON stock.item = item.id \
					JOIN kind ON item.kind = kind.id \
					WHERE orderdetails.quantity > 0 AND orders.type="Inbound" AND stock.whouse=? GROUP BY item.id \
					ORDER BY total_qty DESC',[q1]);

for(var i=0;(i<3) && (i<rows.length) && rows[i].total_qty>0;i++){
	pbody_top_purchased.append('<div class="top-item" style="margin:20px 0;">');
	pbody_top_purchased.append('<img src="img/' + rows[i].id + '.jpg" alt="top-purchased" style="width:50%;">');
	pbody_top_purchased.append('<div class="item-name"><h5>' + findVal('text',rows[i].id) + ' ' + findVal('detail',rows[i].id) +'</h5></div>');
	pbody_top_purchased.append('<div class="item-qty"><span>' + rows[i].total_qty + '</span> pcs purchased</div>');
	pbody_top_purchased.append('<div class="item-price"><span class="glyphicon glyphicon-yen"></span>' + findVal('price',rows[i].id) +'</div></div><hr>');
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

function parseCurrDate(d){
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

$('.stk').css('cursor', 'pointer').on('click', function() {
	window.location = $(this).attr('data-href');
});

//add to cart button functionality
function innerGrep(id) {
	return $.grep(stocks, function(s) {
		return s.id == id;
	});
}

var items = [];

var rows = alasql('SELECT * FROM item \
					JOIN kind ON item.kind = kind.id');

for(var i=0;i<rows.length;i++){
	items.push({
		value: "" + rows[i].id,
		label: '[' + rows[i].code + ']' + rows[i].detail + ' ' + rows[i].maker + ' ' + rows[i].text
	})
}

$( "#item" ).autocomplete({
    source: items,
    focus: function( event, ui ) {
      $( "#item" ).val( ui.item.label );
      return false;
    },
    select: function( event, ui ) {
      $( "#item" ).val( ui.item.label );
      $( "#item-id" ).val( ui.item.value );
      return false;
    }
  });

$('input[name="date"]').val(getCurrDate());
var counter = 1;
var amount = 0;
// update database
$("#cart-add").on('click', function(){
    var htmlCode = '<div class="alert alert-danger alert-dismissible" role="alert">\
    				<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
    				<strong>Danger!</strong>';
	var item = $('#item').val();
	var date = $('input[name="date"]').val();
	var qty = parseInt($('input[name="qty"]').val());
    if(qty < 0){
		$(htmlCode + 'Quantity cant be negative.</div>').insertAfter('#cart-add');
		return;
	}else if(qty == 0){
		$(htmlCode + 'Quantity cant be zero.</div>').insertAfter('#cart-add');
		return;
	}
	if(item==""){
		$('#alert').show();
		return;
	}
	$('#alert').hide();
	var price = alasql('SELECT price FROM item WHERE id = ?', [ parseInt($('#item-id').val()) ])[0].price;
	var curr_amount = price * qty;
    var tr = $('<tr id=' + counter + '></tr>');
	tr.append('<td>' + item + '</td>');
	tr.append('<td>' + date + '</td>');
	tr.append('<td>' + qty + '</td>');
	tr.append('<td>' + numberWithCommas(price) + '</td>');
	tr.append('<td>' + numberWithCommas(curr_amount) + '</td>');
	tr.append('<td><button class="btn btn-danger btn-xs" onclick="remove(' + counter + ');">Delete</button></td>')
	$('#tbody-purchase-cart').append(tr);
	counter++;
	amount += curr_amount;
	$('#amount').text(numberWithCommas(amount));
})

function remove(id){
	var price = numberWithoutCommas($('#tbody-purchase-cart tr#'+id+' td').eq(3).html());
	var quantity = $('#tbody-purchase-cart tr#'+id+' td').eq(2).html();
	var curr_amount = parseInt(quantity, 10) * parseInt(price, 10);
	amount -= curr_amount;
    $("#amount").text(numberWithCommas(amount));	
	$('#tbody-purchase-cart tr#'+id).remove();
}

$('#proc-to-payment').on('click',function(){
	var htmlCode = '<div class="alert alert-danger alert-dismissible" role="alert" id="purchase-alert"> \
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button> \
					<strong>Warning!</strong>Cart is empty.Add items to cart for purchase. \
					</div>';
	if(amount  == 0){
		$(htmlCode).insertAfter('#proc-to-payment');
	}else{
		$('#Modal1').modal('show');
	}	
})

//update stock record
$('#purchase').on('click',function(){
	var v1 = $('input[name="v1"]').val();
	var v2 = $('input[name="v2"]').val();
	var v3 = $('input[name="v3"]').val();		
	var order_id = alasql('SELECT MAX(id) + 1 as id FROM orders')[0].id;	
	var estimatedArrivalDate = new Date();
	var max = -1;
	$('#tbody-purchase-cart tr').each(function(){
		var code = $(this).find('td').eq(0).html();
		var date = $(this).find('td').eq(1).html();
		var qty = parseInt($(this).find('td').eq(2).html());
		var memo = "Inititated purchase.";
		var start = code.indexOf("[");
		var end = code.indexOf("]");
		var subcode = code.substring(start+1,end);
		var item = alasql('SELECT id FROM item WHERE code = ?',[subcode])[0].id;
		var leadtime = alasql('SELECT * FROM item WHERE id=?',[item])[0].leadtime;
		if(leadtime>max){
			max = leadtime;
		}
		var whouse = parseInt($('select[name="q1"]').val());
		var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
		var stock_id, balance = 0,expectedIncoming = 0;
		if (rows.length > 0) {
			stock_id = rows[0].id;
			balance = rows[0].balance;
			expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
		} else {
			stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,item,whouse,50,0,0,0]);
		}
		alasql('UPDATE stock SET expectedIncoming=? WHERE id=?',[expectedIncoming+qty,stock_id]);			
		var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
		alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,qty,date,memo,"Pending"]);				
	});
	estimatedArrivalDate.setDate(estimatedArrivalDate.getDate() + max);
	estimatedArrivalDate = parseCurrDate(estimatedArrivalDate);	
    $('#purchase-modal-body').html("Purchase amounting to " + numberWithCommas(amount) + " yen successful.");
	alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)', [ order_id, "Inbound", findWhouseName(q1), amount, estimatedArrivalDate, "Pending",v1,v2,v3 ]);
	var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
	alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New inbound order with order id - " + order_id + " made.</a>",0]);	
});

$('#purchase-template').on('click',function(){
	var amount = 0;
	var v1 = $('input[name="v1"]').val();
	var v2 = $('input[name="v2"]').val();
	var v3 = $('input[name="v3"]').val();
	var active = $( "#accordion" ).accordion( "option", "active" );
	active++;
	var order_id = alasql('SELECT MAX(id) + 1 as id FROM orders')[0].id;	
	var estimatedArrivalDate = new Date();
	var max = -1;	
	$('#tbody-template-stocks-' + active + ' tr').each(function(){
		var code = $(this).find('td').eq(1).html();
		var date = getCurrDate();
		var price = numberWithoutCommas($(this).find('td').eq(4).html());			
		var qty = parseInt($(this).find('td').eq(5).html());
		var memo = "Inititated purchase.";
		var item = alasql('SELECT id FROM item WHERE code = ?',[code])[0].id;
		var leadtime = alasql('SELECT * FROM item WHERE id=?',[item])[0].leadtime;
		if(leadtime>max){
			max = leadtime;
		}		
		var whouse = parseInt($('select[name="q1"]').val());
		var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
		var stock_id, balance = 0,expectedIncoming = 0;
		if (rows.length > 0) {
			stock_id = rows[0].id;
			balance = rows[0].balance;
			expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
		} else {
			stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,item,whouse,50,0,0,0]);
		}
		alasql('UPDATE stock SET expectedIncoming=? WHERE id=?',[expectedIncoming+qty,stock_id]);			
		var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
		alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,qty,date,memo,"Pending"]);
		amount += price*qty;
	});
	estimatedArrivalDate.setDate(estimatedArrivalDate.getDate() + max);
	estimatedArrivalDate = parseCurrDate(estimatedArrivalDate);	
    $('#purchase-modal-body-template').html("Purchase amounting to " + numberWithCommas(amount) + " yen successful.");
	alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)', [ order_id, "Inbound", findWhouseName(q1), amount, estimatedArrivalDate, "Pending",v1,v2,v3 ]);
	var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
	alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New inbound order with order id - " + order_id + " made.</a>",0]);	
});

$('#replenish').on('click',function(){
	var v1 = $('input[name="v1"]').val();
	var v2 = $('input[name="v2"]').val();
	var v3 = $('input[name="v3"]').val();		
	var order_id = alasql('SELECT MAX(id) + 1 as id FROM orders')[0].id;
	var flag = false;
	var amount = 0;
	var estimatedArrivalDate = new Date();
	var items = alasql('SELECT * FROM item');
	var max = -1;
	for(var i=0;i<items.length;i++){
		var row = alasql('SELECT * FROM stock WHERE whouse=? AND item=?',[q1,items[i].id]);
		var stock_id, quantity, threshold, date, expectedIncoming, committedOutgoing;
		if(row.length==0){
			stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			quantity = 0;
			threshold = 50;
			date = getCurrDate();
			expectedIncoming = 0;
			committedOutgoing = 0;
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,items[i].id,q1,threshold,0,0,0]);
		}else{
			stock_id = row[0].id;
	    	quantity = row[0].balance;
	    	threshold = row[0].threshold;
	    	date = getCurrDate();
			expectedIncoming = row[0].expectedIncoming;
			committedOutgoing = row[0].committedOutgoing;
		}
		if((quantity+expectedIncoming-committedOutgoing) < threshold){
    		flag = true;
    		var leadtime = alasql('SELECT * FROM item WHERE id=?',[items[i].id])[0].leadtime;
    		if(leadtime>max){
    			max = leadtime;
    		}    		
			var memo = "Initiated purchase.";
			price = alasql('SELECT item.price \
					FROM stock \
					JOIN item ON item.id = stock.item \
					WHERE stock.id = ?;',[ parseInt(stock_id) ])[0].price;
			amount += (threshold-quantity-expectedIncoming+committedOutgoing)*price;
			alasql('UPDATE stock SET expectedIncoming=? WHERE id=?',[threshold-quantity+committedOutgoing,stock_id]);			
			var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
			alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,threshold-quantity+committedOutgoing-expectedIncoming,date,memo,"Pending"]);				
    	}
	}
	if(flag == true){
		estimatedArrivalDate.setDate(estimatedArrivalDate.getDate() + max);
		estimatedArrivalDate = parseCurrDate(estimatedArrivalDate);
		alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?);', [order_id,"Inbound", findWhouseName(q1), amount, estimatedArrivalDate, "Pending",v1,v2,v3 ]);
		$('#replenish-modal-body').html("Purchase amounting to " + numberWithCommas(amount) + " yen " + "with OrderID-" + order_id + " successful.");
		var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
		alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New inbound order with order id - " + order_id + " made.</a>",0]);			
	}else{
		$('#replenish-modal-body').html('No items need replenishment.');
	}
})

function findWhouseName(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].name;
}

function findWhouseAddress(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].addr;
}

function findWhouseTel(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].tel;
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

var tbody_template = $('#table-body-new-template');
var item_list_template = [];
var counter2 = 1;
$('.add-row-template').on('click',function(){
    var htmlFailureCode = '<div class="alert alert-danger alert-dismissible" role="alert">\
    	<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
    	<strong>Danger!</strong>';
	var item = parseInt($('select[name="c1"]').val());
	var qty = parseInt($('input[name="c2"]').val() || '-1');
	if(qty<=0){
		$(htmlFailureCode + "Incorrect quantity entered.</div>").insertAfter('#table-new-template');
		return;
	}
	item_list_template.push({
		id: counter2,
		item: item,
		qty: qty
	});
	tbody_template.append('<tr id="' + counter2 + '"> \
							<td> \
								<label>Item : </label>' + findCode(item_list_template[item_list_template.length-1].item) + '\
							</td> \
							<td> \
									<label>Quantity : </label>' + item_list_template[item_list_template.length-1].qty + '\
							</td> \
							<td><button class="btn btn-danger btn-xs" onclick="removeTemplate(' + counter2 + ');">Delete</button></td> \
				</tr>');
	counter2++;
})

function createOrderTemplate(){
    var htmlFailureCode = '<div class="alert alert-danger alert-dismissible" role="alert">\
    	<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
    	<strong>Danger!</strong>';
	if(item_list_template.length==0){
		$(htmlFailureCode + "No items added to template.</div>").insertAfter('#modal-template');
		return;		
	}
	var id = alasql('SELECT MAX(id) AS id FROM purchasetemplateorders')[0].id;
	var order_id = alasql('SELECT MAX(order_id) AS order_id FROM purchasetemplateorders')[0].order_id;
	for(var i=0;i<item_list_template.length;i++){
		var code = item_list_template[i].item;
		var quantity = item_list_template[i].qty;
		alasql('INSERT INTO purchasetemplateorders VALUES(?,?,?,?)',[id+i+1,order_id+1,code,quantity]);
	}
	window.location.reload(true);
}

function removeTemplate(id){
	$('#table-body-new-template tr#'+id).remove();
	for(var i=0;i<item_list_template.length;i++){
		if(item_list_template[i].id == id){
			item_list_template.splice(i,1);
			break;
		}
	}
}

function findCode(id){
	return alasql('SELECT * FROM item WHERE id=?',[id])[0].code;
}

$('.ok').on('click',function(){
	// reload page
	window.location.reload(true);
});

$('#modal-close').on('click',function(){
	window.location.reload(true);
})