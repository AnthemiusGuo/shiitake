// // connect to the socket server
// // var socket = io.connect("ws://127.0.0.1:3000"); 
// var socket = eio.Socket("ws://127.0.0.1:3000");
// // socket.on('open', function () {
// //     socket.send('hi');
// //     socket.on('message', function (msg)
// // 	{ 
// // 		console.log(msg);
// // 	});
// //  });
// var socket = eio('ws://127.0.0.1:3000');
// socket.on('open', function(){
// 	socket.on('message', function(data){console.log(msg);});
// 	socket.on('close', function(){});
// });

// Let the library know where WebSocketMain.swf is:
WEB_SOCKET_SWF_LOCATION = "WebSocketMain.swf";
var packetId = 0;
function sendLobby(category,method,data) {
	var dd = new Date();
	var ts = dd.getTime();
	var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':1};
	lobbySocket.send(JSON.stringify(packet));
	packetId++;
	sendLog("lobby",packet);
}

function sendLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	console.log("log");
	$("#send").append("sock "+typ+":"+log+"<br/>");
}

function recvLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	$("#recv").append("sock "+typ+":"+log+"<br/>");
}

function sendGame(category,method,data) {
	var dd = new Date();
	var ts = dd.getTime();
	var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':1};
	gameSocket.send(JSON.stringify(packet));
	packetId++;
	sendLog("game",packet);
}

// Write your code in the same way as for native WebSocket:
var lobbySocket = new WebSocket("ws://127.0.0.1:3000");
lobbySocket.onopen = function() {
	recvLog("lobby","open");
	sendLobby('user','login',{uid:1})
};
lobbySocket.onmessage = function(e) {
// Receives a message.
	recvLog("lobby",e.data);
};
lobbySocket.onclose = function() {
	recvLog("lobby","closed");
};

var gameSocket = new WebSocket("ws://127.0.0.1:3010");
gameSocket.onopen = function() {
	recvLog("game","open");
	sendGame('user','login',{uid:1})
};
gameSocket.onmessage = function(e) {
	recvLog("game",e.data);
};
gameSocket.onclose = function() {
	recvLog("game","closed");
};
