// Below function Executes on click of login button.
function validate(){
	var username = $('input[name="l1"]').val();
	var password = $('input[name="l2"]').val();
	if ( username == "superuser" && password == "superuser"){
		alert("Login successfully");
		window.sessionStorage.setItem('user','superuser');
		window.location.assign('superuser.html'); // Redirecting to other page.
	}
	else if (username == "salesteam" && password == "salesteam"){
		alert("Login successfully");
		window.sessionStorage.setItem('user','salesteam');
		window.location.assign('sales.html'); // Redirecting to other page.
	}
	else if (username == "purchaseteam" && password == "purchaseteam"){
		alert("Login successfully");
		window.sessionStorage.setItem('user','purchaseteam');
		window.location.assign('stock-form.html'); // Redirecting to other page.
	}
	else if (username == "porter" && password == "porter"){
		alert("Login successfully");
		window.sessionStorage.setItem('user','porter');
		window.location.assign('order.html'); // Redirecting to other page.
	}else{
		alert("Login unsuccessful");
	}
	
}