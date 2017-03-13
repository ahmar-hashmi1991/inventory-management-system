var user = window.sessionStorage.getItem('user');
if(user != "superuser" && user != "salesteam"){
	window.location.assign("index.html");
}

if(user == "salesteam"){
	$('#side-bar').find('li').each(function(){
		if(!$(this).hasClass('active')){
			$(this).css('display','none');
		}
	});
}

// create search box
var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	var option3 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.name);
	option3.attr('value', row.id);
	option3.text(row.name);
	$('select[name="q1"]').append(option1);
	$('select[name="t1"]').append(option3);
}

var rows = alasql('SELECT id,code FROM item;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	var option2 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.code);
	option2.attr('value', row.id);
	option2.text(row.code);
	$('select[name="t2"]').append(option1);
	$('select[name="c1"]').append(option2);
}

var rows = alasql('SELECT * FROM kind;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	var option2 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.text);
	option2.attr('value', row.id);
	option2.text(row.text);
	$('select[name="q2"]').append(option1);
	$('select[name="p2"]').append(option2);
}

// get search params
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
var sql = 'SELECT stock.id, whouse.name, kind.text, item.code, item.maker, item.detail, item.price, stock.balance, item.unit, stock.threshold,stock.expectedIncoming, stock.committedOutgoing \
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
	tr.appendTo(tbody);
}

var max = alasql('SELECT MAX(order_id) AS order_id FROM templateorders')[0].order_id;
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

var rows = alasql('SELECT * FROM templateorders \
					JOIN item ON templateorders.item_id = item.id \
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

//top 3 and bottom 3 selling products
var pbody_top_selling = $('#top-selling .panel-body');

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

var rows = alasql('SELECT item.id,ABS(SUM(orderdetails.quantity)) AS total_qty \
					FROM orderdetails \
					JOIN orders ON orderdetails.order_id = orders.id \
					JOIN stock ON orderdetails.stock_id = stock.id \
					JOIN item ON stock.item = item.id \
					JOIN kind ON item.kind = kind.id \
					WHERE orderdetails.quantity > 0 AND orders.type="Outbound" AND stock.whouse=? GROUP BY item.id \
					ORDER BY total_qty DESC',[q1]);

for(var i=0;(i<3) && (i<rows.length) && rows[i].total_qty>0;i++){
	pbody_top_selling.append('<div class="top-item" style="margin:20px 0;">');
	pbody_top_selling.append('<img src="img/' + rows[i].id + '.jpg" alt="top-selling" style="width:50%;">');
	pbody_top_selling.append('<div class="item-name"><h5>' + findVal('text',rows[i].id) + ' ' + findVal('detail',rows[i].id) +'</h5></div>');
	pbody_top_selling.append('<div class="item-qty"><span>' + rows[i].total_qty + '</span> pcs sold</div>');
	pbody_top_selling.append('<div class="item-price"><span class="glyphicon glyphicon-yen"></span>' + findVal('price',rows[i].id) +'</div></div><hr>');
}

//sort functionality
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
	switch(index){
		case 4: return numberWithoutCommas($(row).children('td').eq(4).html());
		default: return $(row).children('td').eq(index).html();
	}
}

//added features

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

//export data to CSV
function exportData(){
    var data = alasql('SELECT Classification,Code,Maker,Detail,Price,[In Stock],[Expected Incoming],[Committed Outgoing] FROM HTML("#stock-list",{headers:true})');
    alasql('SELECT * INTO CSV("stock-list.csv",{headers:true}) FROM ?', [data]);
}


//add to cart button functionality
function innerGrep(id) {
	return $.grep(stocks, function(s) {
		return s.id == id;
	});
}

var counter = 1;
var amount = 0;

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
	$('#tbody-sale-cart').append(tr);
	counter++;
	amount += curr_amount;
	$('#amount').text(numberWithCommas(amount));
})

function remove(id){
	var price = numberWithoutCommas($('#tbody-sale-cart tr#'+id+' td').eq(3).html());
	var quantity = $('#tbody-sale-cart tr#'+id+' td').eq(2).html();
	var curr_amount = parseInt(quantity, 10) * parseInt(price, 10);
	amount -= curr_amount;
    $("#amount").text(numberWithCommas(amount));	
	$('#tbody-sale-cart tr#'+id).remove();
}

//proceed to payment button
$('#proc-to-payment').on('click',function(){
	var htmlCode = '<div class="alert alert-danger alert-dismissible" role="alert" id="alert"> \
					<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button> \
					<strong>Warning!</strong>';
	if(amount  == 0){
		$(htmlCode + 'Cart is empty.Add items to cart for sale.</div>').insertAfter('#proc-to-payment');
	}else{
		$('#Modal1').modal('show');
	}
})

//update stock record
$('#buy').on('click',function(){
	var outstanding = [];
	var c1 = $('input[name="name"]').val();
	var c2 = $('input[name="addr"]').val();
	var c3 = $('input[name="tel"]').val();
	var amount1 = 0;
	var amount2 = 0;
	$('#tbody-sale-cart tr').each(function(){
		var code = $(this).find('td').eq(0).html();
		var date = $(this).find('td').eq(1).html();
		var quantity = parseInt($(this).find('td').eq(2).html());
		var start = code.indexOf("[");
		var end = code.indexOf("]");
		var subcode = code.substring(start+1,end);
		var item = alasql('SELECT id FROM item WHERE code = ?',[subcode])[0].id;
		var whouse = parseInt($('select[name="q1"]').val());
		var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
		var stock_id, balance = 0,expectedIncoming = 0, committedOutgoing = 0, inStock = 0,totalIncoming = 0, totalOutgoing = quantity;
		if (rows.length > 0) {
			stock_id = rows[0].id;
			balance = rows[0].balance;
			inStock = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].balance;
			expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
			committedOutgoing = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].committedOutgoing;
			totalIncoming = inStock + expectedIncoming;		
			totalOutgoing += committedOutgoing;
		}else{
			stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,item,whouse,50,0,0,0]);
		}
    	if(totalIncoming<totalOutgoing){
    		outstanding.push(stock_id);
    	}
	});
	if(outstanding.length==0 || (outstanding.length>0 && window.confirm("Not enough quantity of item expected to come.Are you sure to continue?"))){
		var estimatedDeliveryDate = $('#datepicker3').datepicker({ dateFormat: 'yy-mm-dd' }).val();
		if(estimatedDeliveryDate == ""){
			estimatedDeliveryDate = new Date();	
			estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 14);
			estimatedDeliveryDate = parseCurrDate(estimatedDeliveryDate);			
		}
		var order_id = alasql('SELECT MAX(id) + 1 as id FROM orders')[0].id;	
		$('#tbody-sale-cart tr').each(function(){
			var code = $(this).find('td').eq(0).html();
			var price = numberWithoutCommas($(this).find('td').eq(3).html());
			var date = $(this).find('td').eq(1).html();
			var qty = parseInt($(this).find('td').eq(2).html());
			var memo = "Inititated sale.";
			var start = code.indexOf("[");
			var end = code.indexOf("]");
			var subcode = code.substring(start+1,end);
			var item = alasql('SELECT id FROM item WHERE code = ?',[subcode])[0].id;
			var whouse = parseInt($('select[name="q1"]').val());
			var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
			var stock_id, balance = 0,inStock = 0, expectedIncoming = 0, committedOutgoing = 0,threshold=50;
			if (rows.length > 0) {
				stock_id = rows[0].id;
				balance = rows[0].balance;
				inStock = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].balance;
				expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;				
				committedOutgoing = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].committedOutgoing;
				threshold = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].threshold;
			} else {
				stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
				alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,item,whouse,50,0,0,0]);
			}
			var net_stock = inStock + expectedIncoming - qty - committedOutgoing;
			if(net_stock < threshold){
				var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
				alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'purchaseteam',"<a>Item with code - " + subcode + " became low-stock.</a>",0]);				
				var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
				alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='stock-form.html'>Item with code - " + subcode + " became low-stock.</a>",0]);				
			}
			alasql('UPDATE stock SET committedOutgoing=? WHERE id=?',[committedOutgoing+qty,stock_id]);
			var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
			var flag = 0;
			for(var i=0;i<outstanding.length;i++){
				if(outstanding[i]==stock_id){
					flag = 1;
					break;
				}
			}
			if(flag==0){
				alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,qty,date,memo,"Pending"]);
				amount1 += price*qty;
			}else{
				alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id+1,stock_id,qty,date,memo,"Pending"]);				
				amount2 += price*qty;
			}
		});
		alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)', [ order_id, "Outbound", findWhouseName(q1), amount1, estimatedDeliveryDate, "Pending",c1,c2,c3 ]);    
		if(outstanding.length > 0){
		    $('#sale-modal-body').html("Sale amounting to " + numberWithCommas(amount1+amount2) + " yen successful.");
			alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)', [ order_id+1, "Outbound", findWhouseName(q1), amount2, "" , "Not in stock",c1,c2,c3 ]);    			
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + order_id + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + order_id + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + (order_id+1) + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + (order_id+1) + " received.</a>",0]);
		}else{
		    $('#sale-modal-body').html("Sale amounting to " + numberWithCommas(amount1) + " yen successful.");			
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + order_id + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + order_id + " received.</a>",0]);
		}
	}
});

//update stock record
$('#buy-template').on('click',function(){
	var c1 = $('input[name="name"]').val();
	var c2 = $('input[name="addr"]').val();
	var c3 = $('input[name="tel"]').val();	
	var outstanding = [];
	var active = $( "#accordion" ).accordion( "option", "active" );
	active++;
	var amount1 = 0;
	var amount2 = 0;
	$('#tbody-template-stocks-' + active + ' tr').each(function(){
		var code = $(this).find('td').eq(1).html();
		var quantity = parseInt($(this).find('td').eq(5).html());
		var item = alasql('SELECT id FROM item WHERE code = ?',[code])[0].id;
		var whouse = parseInt($('select[name="q1"]').val());
		var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
		var stock_id, balance = 0,expectedIncoming = 0, committedOutgoing = 0, inStock = 0,totalIncoming = 0, totalOutgoing = quantity;
		if (rows.length > 0) {
			stock_id = rows[0].id;
			balance = rows[0].balance;
			inStock = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].balance;
			expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
			committedOutgoing = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].committedOutgoing;
			totalIncoming = inStock + expectedIncoming;		
			totalOutgoing += committedOutgoing;
		}else{
			stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,item,whouse,50,0,0,0]);
		}
    	if(totalIncoming<totalOutgoing){
    		outstanding.push(stock_id);
    	}
	});
	if(outstanding.length==0 || (outstanding.length>0 && window.confirm("Not enough quantity of item expected to come.Are you sure to continue?"))){
		var estimatedDeliveryDate = $('#datepicker3').datepicker({ dateFormat: 'yy-mm-dd' }).val();
		if(estimatedDeliveryDate == ""){
			estimatedDeliveryDate = new Date();	
			estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 14);
			estimatedDeliveryDate = parseCurrDate(estimatedDeliveryDate);			
		}
		var order_id = alasql('SELECT MAX(id) + 1 as id FROM orders')[0].id;
		$('#tbody-template-stocks-' + active + ' tr').each(function(){
			var code = $(this).find('td').eq(1).html();
			var price = numberWithoutCommas($(this).find('td').eq(4).html());			
			var qty = parseInt($(this).find('td').eq(5).html());
			var item = alasql('SELECT id FROM item WHERE code = ?',[code])[0].id;
			var memo = "Inititated sale.";
			var date = getCurrDate();
			var whouse = parseInt($('select[name="q1"]').val());
			var rows = alasql('SELECT id, balance FROM stock WHERE whouse = ? AND item = ?', [ whouse, item ]);
			var stock_id, balance = 0,inStock = 0, expectedIncoming = 0, committedOutgoing = 0,threshold=50;
			if (rows.length > 0) {
				stock_id = rows[0].id;
				balance = rows[0].balance;
				inStock = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].balance;
				expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;				
				committedOutgoing = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].committedOutgoing;
				threshold = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].threshold;
			} else {
				stock_id = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
				alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[stock_id,item,whouse,50,0,0,0]);
			}
			var net_stock = inStock + expectedIncoming - qty - committedOutgoing;
			if(net_stock < threshold){
				var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
				alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'purchaseteam',"<a>Item with code - " + code + " became low-stock.</a>",0]);				
				var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
				alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='stock-form.html'>Item with code - " + code + " became low-stock.</a>",0]);				
			}
			alasql('UPDATE stock SET committedOutgoing=? WHERE id=?',[committedOutgoing+qty,stock_id]);			
			var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
			var flag = 0;
			for(var i=0;i<outstanding.length;i++){
				if(outstanding[i]==stock_id){
					flag = 1;
					break;
				}
			}
			if(flag==0){
				alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,qty,date,memo,"Pending"]);
				amount1 += price*qty;
			}else{
				alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id+1,stock_id,qty,date,memo,"Pending"]);				
				amount2 += price*qty;
			}
		});
		alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)', [ order_id, "Outbound", findWhouseName(q1), amount1, estimatedDeliveryDate, "Pending",c1,c2,c3 ]);    
		if(outstanding.length > 0){
		    $('#sale-modal-body-template').html("Sale amounting to " + numberWithCommas(amount1+amount2) + " yen successful.");
			alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?)', [ order_id+1, "Outbound", findWhouseName(q1), amount2, "" , "Not in stock",c1,c2,c3 ]);    			
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + order_id + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + order_id + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + (order_id+1) + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + (order_id+1) + " received.</a>",0]);
		}else{
		    $('#sale-modal-body-template').html("Sale amounting to " + numberWithCommas(amount1) + " yen successful.");			
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + order_id + " received.</a>",0]);
			var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
			alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + order_id + " received.</a>",0]);
		}
	}
});

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

function findWhouseName(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].name;
}

function findWhouseAddress(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].addr;
}

function findWhouseTel(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].tel;
}

$(".ok").on('click',function(){
	window.location.reload(true);
})


// click event
$('.stk').css('cursor', 'pointer').on('click', function() {
	window.location = $(this).attr('data-href');
});

$('select[name="t2"]').on('change',function(){
	var t2 = parseInt($('select[name="t2"]').val());
	var fromWhouse = parseInt($('select[name="q1"]').val());
	var row = alasql('SELECT * FROM stock WHERE item=? AND whouse=?',[t2,fromWhouse]);
	var t3;
	if(row.length)
		t3 = row[0].balance;
	else
		t3 = 0;
	$('input[name="t3"]').val(t3);	
});

$('#Modal3').on('shown.bs.modal',function(){
	$('select[name="t2"]').trigger('change');
});

var tbody = $('#table-body-stock-transfer');
$('select[name="t1"]').on('change',function(){
	tbody.empty();
});

var item_list = [];
var counter3 = 1;
$('.add-row').on('click',function(){
    var htmlFailureCode = '<div class="alert alert-danger alert-dismissible" role="alert">\
    	<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
    	<strong>Danger!</strong>';
	var item = parseInt($('select[name="t2"]').val());
	var qty = parseInt($('input[name="t4"]').val() || '-1');
	var balance = parseInt($('input[name="t3"]').val());
	if(qty<=0){
		$(htmlFailureCode + "Incorrect quantity entered.</div>").insertAfter('#table-stock-transfer');
		return;
	}
	if(balance<qty){
		$(htmlFailureCode + "Cannot transfer this stock as quantity requested is more than the quantity in stock.</div>").insertAfter('#table-stock-transfer');
		return;
	}
	item_list.push({
		id:counter3,
		item: item,
		qty: qty
	});
	tbody.append('<tr id="' + counter3 + '"> \
							<td> \
								<label>Item : </label>' + findCode(item_list[item_list.length-1].item) + '\
							</td> \
							<td> \
									<label>Quantity : </label>' + item_list[item_list.length-1].qty + '\
							</td> \
							<td><button class="btn btn-danger btn-xs" onclick="removeStockTransferItem(' + counter3 + ');">Delete</button></td> \
				</tr>');
})

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
	var id = alasql('SELECT MAX(id) AS id FROM templateorders')[0].id;
	var order_id = alasql('SELECT MAX(order_id) AS order_id FROM templateorders')[0].order_id;
	for(var i=0;i<item_list_template.length;i++){
		var code = item_list_template[i].item;
		var quantity = item_list_template[i].qty;
		alasql('INSERT INTO templateorders VALUES(?,?,?,?)',[id+i+1,order_id+1,code,quantity]);
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

function removeStockTransferItem(id){
	$('#table-body-stock-transfer tr#'+id).remove();
	for(var i=0;i<item_list.length;i++){
		if(item_list[i].id == id){
			item_list.splice(i,1);
			break;
		}
	}
}

function findCode(id){
	return alasql('SELECT * FROM item WHERE id=?',[id])[0].code;
}

//perform stock transfer
function handleTransfer(){
    var htmlFailureCode = '<div class="alert alert-danger alert-dismissible" role="alert">\
    	<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
    	<strong>Danger!</strong>';
	var htmlSuccessCode = '<div class="alert alert-success alert-dismissible" role="alert">\
    	<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
    	<strong>Success!</strong>';
    var q1 = parseInt($('select[name="q1"]').val());
	var t1 = parseInt($('select[name="t1"]').val());
	var estimatedDeliveryDate = $('#datepicker2').datepicker({ dateFormat: 'yy-mm-dd' }).val();
	if(item_list.length==0){
		$(htmlFailureCode + 'No items added for transfer.</div>').insertAfter('#transfer');
		return;
	}
	if(q1 == t1){
	    $(htmlFailureCode + 'Cannot perform stock transfer as source and destination are same.</div>').insertAfter('#transfer');
	    return;
	}
	if(estimatedDeliveryDate == ""){
		$(htmlFailureCode + 'No estimated delivery entered.</div>').insertAfter('#transfer');
		return;
	}
	var items = [];
	var sourceIds = [];
	var destinationIds = [];
	for(var i=0;i<item_list.length;i++){			
		var rows = alasql('SELECT * FROM stock WHERE item = ? AND whouse = ?',[ item_list[i].item,q1 ]);
		var sourceBalance,sourceId,destinationBalance,destinationId;
		sourceBalance = rows[0].balance;
		sourceId = rows[0].id;
		var rows = alasql('SELECT * FROM stock WHERE item = ? AND whouse = ?',[ item_list[i].item, t1 ]);
		if(rows.length>0){
			destinationBalance = rows[0].balance;
			destinationId = rows[0].id;
		}else{
			destinationBalance = 0;
			destinationId = alasql('SELECT MAX(id) + 1 as id FROM stock')[0].id;
		}
		sourceIds.push(sourceId);
		if(destinationBalance==0)
			alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?)',[destinationId,item_list[i].item,t1,50,0,0,0]);
		destinationIds.push(destinationId);
		items.push(item_list[i]);
		$(htmlSuccessCode+"Stock Transfer for item " + findCode(item_list[i].item) + " successful.</div>").insertAfter('#transfer');
	}
	if(items.length>0){
		var amount = 0;
		//source side,outbound order
		var order_id = alasql('SELECT MAX(id)+1 as id FROM orders')[0].id;
		for(var i=0;i<items.length;i++){
			var stock_id = sourceIds[i];
	    	var quantity = items[i].qty;
			var date = getCurrDate();
			var inStock = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].balance;
			var committedOutgoing = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].committedOutgoing;
			var expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
			var threshold = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].threshold;
			var net_stock = inStock + expectedIncoming - committedOutgoing - quantity;
			var memo = "Initiated transfer source side.";
			price = alasql('SELECT item.price \
					FROM stock \
					JOIN item ON item.id = stock.item \
					WHERE stock.id = ?;',[ parseInt(stock_id) ])[0].price;
			amount += quantity*price;
			alasql('UPDATE stock SET committedOutgoing=? WHERE id=?',[committedOutgoing+quantity,stock_id]);
			var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
			alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,quantity,date,memo,"Pending"]);
			var code = alasql('SELECT * FROM item JOIN stock ON stock.item = item.id WHERE stock.id=?',[stock_id])[0].code;
			if(net_stock < threshold){
				var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
				alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'purchaseteam',"<a>Item with code - " + code + " became low-stock.</a>",0]);				
				var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
				alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='stock-form.html'>Item with code - " + code + " became low-stock.</a>",0]);				
			}
		}
		alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?);', [ order_id, "Outbound", findWhouseName(q1), amount, estimatedDeliveryDate, "Pending" , findWhouseName(t1), findWhouseAddress(t1), findWhouseTel(t1) ]);
		var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
		alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'porter',"<a>New outbound order with order id - " + order_id + " received.</a>",0]);
		var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
		alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,q1,'superuser',"<a href='order.html'>New outbound order with order id - " + order_id + " received.</a>",0]);
		
		var amount = 0;
		var estimatedArrivalDate = estimatedDeliveryDate;
		//destination side, inbound order
		var order_id = alasql('SELECT MAX(id) + 1 as id FROM orders')[0].id;
		for(var i=0;i<items.length;i++){
			var stock_id = destinationIds[i];
	    	var quantity = items[i].qty;
	    	var date = getCurrDate();
			var expectedIncoming = alasql('SELECT * FROM stock WHERE id=?',[stock_id])[0].expectedIncoming;
			var memo = "Initiated transfer destination side.";
			price = alasql('SELECT item.price \
					FROM stock \
					JOIN item ON item.id = stock.item \
					WHERE stock.id = ?;',[ parseInt(stock_id) ])[0].price;
			amount += quantity*price;
			alasql('UPDATE stock SET expectedIncoming=? WHERE id=?',[expectedIncoming+quantity,stock_id]);			
			var orderdetail_id = alasql('SELECT MAX(id)+1 as id FROM orderdetails')[0].id;
			alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?)',[orderdetail_id,order_id,stock_id,quantity,date,memo,"Pending"]);				
		}
		alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?);', [order_id,"Inbound", findWhouseName(t1), amount, estimatedArrivalDate, "Pending" , findWhouseName(q1), findWhouseAddress(q1), findWhouseTel(q1) ]);
		var id = alasql('SELECT MAX(id) + 1 as id FROM notifications')[0].id;
		alasql('INSERT INTO notifications VALUES(?,?,?,?,?)',[id,t1,'superuser',"<a href='order.html'>New inbound order with order id - " + order_id + " made.</a>",0]);
	}
}