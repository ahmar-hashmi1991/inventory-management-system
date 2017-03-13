var user = window.sessionStorage.getItem('user');
if(user != "superuser"){
	window.location.assign("index.html");
}

// create search box
var rows = alasql('SELECT * FROM whouse;');
for (var i = 0; i < rows.length; i++) {
	var row = rows[i];
	var option1 = $('<option>');
	option1.attr('value', row.id);
	option1.text(row.name);
	$('select[name="q1"]').append(option1);
}

$('select[name="q1"]').on('change',function(){
	$('#form1').trigger('submit');
});

//get search params
var q1 = parseInt($.url().param('q1') || '1');
$('select[name="q1"]').val(q1);

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

function findWhouseName(id){
	return alasql('SELECT * FROM whouse WHERE id=?',[parseInt(id)])[0].name;
}

var qty_to_be_packed = alasql('SELECT SUM(quantity) AS qty \
								FROM orderdetails \
								JOIN stock ON orderdetails.stock_id = stock.id \
								JOIN orders ON orderdetails.order_id = orders.id \
								WHERE (orderdetails.status="Pending" OR orderdetails.status="Not in stock") AND orders.type="Outbound" AND stock.whouse=?',[q1])[0].qty;
var pkg_to_be_shipped = alasql('SELECT COUNT(*) AS cnt \
								FROM orders WHERE (status="Pending" OR status="Retrieving") AND type="Outbound" AND whouse=?',[findWhouseName(q1)])[0].cnt;
var pkg_to_be_received = alasql('SELECT COUNT(*) AS cnt \
								FROM orders WHERE (status="Pending" OR status="Storing") AND type="Inbound" AND whouse=?',[findWhouseName(q1)])[0].cnt;
var qty_in_hand = alasql('SELECT SUM(balance) AS qty FROM stock WHERE whouse=?',[q1])[0].qty;

$('#qty-to-be-packed').text(qty_to_be_packed);
$('#pkg-to-be-shipped').text(pkg_to_be_shipped);
$('#pkg-to-be-received').text(pkg_to_be_received);
$('#qty-in-hand').text(qty_in_hand);

function addNewWarehouse(){
	if(window.confirm('Are you sure you want to add the following warehouse?')){
		var w1 = $('input[name="w1"]').val();
		var w2 = $('input[name="w2"]').val();
		var w3 = $('input[name="w3"]').val();
		if(w1=="" || w2=="" || w3==""){
			alert("All values not entered.");
			return;
		}
		var warehouse_id = alasql('SELECT MAX(id) + 1 as id FROM whouse')[0].id;
		alasql('INSERT INTO whouse VALUES(?,?,?,?)', [warehouse_id,w1,w2,w3] );
		var productcodes = alasql('SELECT code FROM item');
		for(var i=0;i<productcodes.length;i++){
			var shelf_id = alasql('SELECT MAX(id) + 1 as id FROM shelves')[0].id;
			var shelf_number = alasql('SELECT MAX(shelfnumber) + 1 as shelfnumber FROM shelves')[0].shelfnumber;
			alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelf_id,shelf_number,warehouse_id,productcodes[i].code,0]);
		}
		window.location.reload(true);
	}
}

function addNewProduct(){
	if(window.confirm('Are you sure you want to add the following product?')){
		var p1 = $('input[name="p1"]').val();
		var p2 = parseInt($('select[name="p2"]').val());
		var p3 = $('input[name="p3"]').val();
		var p4 = $('input[name="p4"]').val();
		var p5 = parseInt($('input[name="p5"]').val());
		var p6 = $('input[name="p6"]').val();
		var p7 = $('input[name="p7"]').val();
		if(p1=="" || p2==0 || p3=="" || p4=="" || p5=="" || p6=="" || p7==""){
			alert("All values not entered.");
			return;
		}
		var product_id = alasql('SELECT MAX(id) + 1 as id FROM item')[0].id;
		alasql('INSERT INTO item VALUES(?,?,?,?,?,?,?,?)', [product_id,p1,p2,p3,p4,p5,p6,p7] );
		var shelf_id = alasql('SELECT MAX(id) as id FROM shelves')[0].id;
		var no_of_warehouses = alasql('SELECT MAX(id) + 1 as id FROM whouse')[0].id;
		for(var i=1;i<no_of_warehouses;i++){
			var shelf_number = alasql('SELECT MAX(shelfnumber)+1 as shelfnumber FROM shelves')[0].shelfnumber;
			alasql('INSERT INTO shelves VALUES(?,?,?,?,?)',[shelf_id+i,shelf_number,i,p1,0] );
		}
		window.location.reload(true);
	}
}                      