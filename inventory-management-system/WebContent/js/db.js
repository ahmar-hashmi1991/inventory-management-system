var DB = {};

DB.init = function() {
	if (window.confirm('are you sure to initialize database?')) {
		DB.load();
	}
};

DB.load = function() {
	alasql.options.joinstar = 'overwrite';

	// Classes
	alasql('DROP TABLE IF EXISTS kind;');
	alasql('CREATE TABLE kind(id INT IDENTITY, text STRING);');
	var pkind = alasql.promise('SELECT MATRIX * FROM CSV("data/KIND-KIND.csv", {headers: true})').then(function(kinds) {
		for (var i = 0; i < kinds.length; i++) {
			var kind = kinds[i];
			alasql('INSERT INTO kind VALUES(?,?);', kind);
		}
	});

	// Items
	alasql('DROP TABLE IF EXISTS item;');
	alasql('CREATE TABLE item(id INT IDENTITY, code STRING, kind INT, detail STRING, maker STRING, price INT, unit STRING,leadtime INT);');
	var pitem = alasql.promise('SELECT MATRIX * FROM CSV("data/ITEM-ITEM.csv", {headers: true})').then(function(items) {
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			alasql('INSERT INTO item VALUES(?,?,?,?,?,?,?,?);', item);
		}
	});

	// Warehouses
	alasql('DROP TABLE IF EXISTS whouse;');
	alasql('CREATE TABLE whouse(id INT IDENTITY, name STRING, addr STRING, tel STRING);');
	var pwhouse = alasql.promise('SELECT MATRIX * FROM CSV("data/WHOUSE-WHOUSE.csv", {headers: true})').then(
			function(whouses) {
				for (var i = 0; i < whouses.length; i++) {
					var whouse = whouses[i];
					alasql('INSERT INTO whouse VALUES(?,?,?,?);', whouse);
				}
			});

	// Inventories
	alasql('DROP TABLE IF EXISTS stock;');
	alasql('CREATE TABLE stock(id INT IDENTITY, item INT, whouse INT, threshold INT,balance INT,expectedIncoming INT,committedOutgoing INT);');
	var pstock = alasql.promise('SELECT MATRIX * FROM CSV("data/STOCK-STOCK.csv", {headers: true})').then(
			function(stocks) {
				for (var i = 0; i < stocks.length; i++) {
					var stock = stocks[i];
					alasql('INSERT INTO stock VALUES(?,?,?,?,?,?,?);', stock);
				}
			});

	// Transaction
	alasql('DROP TABLE IF EXISTS trans;');
	alasql('CREATE TABLE trans(id INT IDENTITY, stock INT, date DATE, qty INT, balance INT, memo STRING,orderID INT);');
	var ptrans = alasql.promise('SELECT MATRIX * FROM CSV("data/TRANS-TRANS.csv", {headers: true})').then(
			function(transs) {
				for (var i = 0; i < transs.length; i++) {
					var trans = transs[i];
					alasql('INSERT INTO trans VALUES(?,?,?,?,?,?,?);', trans);
				}
			});
	
	//Orders
	alasql('DROP TABLE IF EXISTS orders;');
	alasql('CREATE TABLE orders(id INT IDENTITY, type STRING,whouse STRING, amount INT,estimatedDate DATE, status STRING, name STRING, address STRING, tel STRING);');
	var porders = alasql.promise('SELECT MATRIX * FROM CSV("data/ORDER-ORDER.csv", {headers: true})').then(
			function(orders) {
				for (var i = 0; i < orders.length; i++) {
					var order = orders[i];
					alasql('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?);', order);
				}
			});

	//Orderdetails
	alasql('DROP TABLE IF EXISTS orderdetails;');
	alasql('CREATE TABLE orderdetails(id INT IDENTITY, order_id INT,stock_id INT,quantity INT, date DATE, memo STRING, status STRING);');
	var porderdetails = alasql.promise('SELECT MATRIX * FROM CSV("data/ORDERDETAILS-ORDERDETAILS.csv", {headers: true})').then(
			function(orderdetails) {
				for (var i = 0; i < orderdetails.length; i++) {
					var orderdetail = orderdetails[i];
					alasql('INSERT INTO orderdetails VALUES(?,?,?,?,?,?,?);', orderdetail);
				}
			});

	//Shelves
	alasql('DROP TABLE IF EXISTS shelves;');
	alasql('CREATE TABLE shelves(id INT IDENTITY, shelfnumber INT, warehouseid INT, productcode STRING, quantity INT);');
	var pshelves = alasql.promise('SELECT MATRIX * FROM CSV("data/SHELF-SHELF.csv", {headers: true})').then(
			function(shelves) {
				for (var i = 0; i < shelves.length; i++) {
					var shelf = shelves[i];
					alasql('INSERT INTO shelves VALUES(?,?,?,?,?);', shelf);
				}
			});	

	//Templateorders
	alasql('DROP TABLE IF EXISTS templateorders;');
	alasql('CREATE TABLE templateorders(id INT IDENTITY, order_id INT,item_id INT,quantity INT);');
	var ptemplateorders = alasql.promise('SELECT MATRIX * FROM CSV("data/TEMPLATEORDERS-TEMPLATEORDERS.csv", {headers: true})').then(
			function(templateorders) {
				for (var i = 0; i < templateorders.length; i++) {
					var templateorder = templateorders[i];
					alasql('INSERT INTO templateorders VALUES(?,?,?,?);', templateorder);
				}
			});

	//PurchaseTemplateorders
	alasql('DROP TABLE IF EXISTS purchasetemplateorders;');
	alasql('CREATE TABLE purchasetemplateorders(id INT IDENTITY, order_id INT,item_id INT,quantity INT);');
	var ppurchasetemplateorders = alasql.promise('SELECT MATRIX * FROM CSV("data/PTEMPLATEORDERS-PTEMPLATEORDERS.csv", {headers: true})').then(
			function(templateorders) {
				for (var i = 0; i < templateorders.length; i++) {
					var templateorder = templateorders[i];
					alasql('INSERT INTO purchasetemplateorders VALUES(?,?,?,?);', templateorder);
				}
			});
	
	//Shelves
	alasql('DROP TABLE IF EXISTS reports;');
	alasql('CREATE TABLE reports(id INT IDENTITY, whouseid INT, itemid INT, quantity INT, issue STRING,status STRING);');
	var preports = alasql.promise('SELECT MATRIX * FROM CSV("data/REPORTS-REPORTS.csv", {headers: true})').then(
			function(reports) {
				for (var i = 0; i < reports.length; i++) {
					var report = reports[i];
					alasql('INSERT INTO reports VALUES(?,?,?,?,?,?);', report);
				}
			});	
	
	alasql('DROP TABLE IF EXISTS notifications;');
	alasql('CREATE TABLE notifications(id INT IDENTITY, whouse INT, user STRING, notification STRING, flag INT);'); //flag: 0 (unread), 1 (read)
	var pnotifications = alasql.promise('SELECT MATRIX * FROM CSV("data/NOTIFS-NOTIFS.csv", {headers:true})').then(
			function(notifications) {
				for (var i = 0; i < notifications.length; i++) {
					var notification = notifications[i];
					alasql('INSERT INTO notifications VALUES(?,?,?,?,?);', notification);
				}
			});	

	// Reload page
	Promise.all([ pkind, pitem, pwhouse, pstock, ptrans, porders,porderdetails, pshelves, ptemplateorders, preports, pnotifications, ppurchasetemplateorders ]).then(function() {
		window.location.reload(true);
	});
};

DB.remove = function() {
	if (window.confirm('are you sure to delete dababase?')) {
		alasql('DROP localStorage DATABASE STK')
	}
};

DB.logout = function(user) {
	if (window.confirm('are you sure to logout?')) {
		window.sessionStorage.removeItem('user');
		window.location.assign('index.html');
	}
};

// add commas to number
function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

//removes commas from number
function numberWithoutCommas(x) {
	return x.toString().replace(',' , '');
}

// DO NOT CHANGE!
alasql.promise = function(sql, params) {
	return new Promise(function(resolve, reject) {
		alasql(sql, params, function(data, err) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
};

// connect to database
try {
	alasql('ATTACH localStorage DATABASE STK;');
	alasql('USE STK;');
} catch (e) {
	alasql('CREATE localStorage DATABASE STK;');
	alasql('ATTACH localStorage DATABASE STK;');
	alasql('USE STK;');
	DB.load();
}
