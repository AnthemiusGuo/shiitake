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

function consoleLog(typ,msg){
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	$("#console").append("<b>sock "+typ+"</b>:"+log+"<br/>");
}

function sendLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	console.log("send");
	$("#send").append("<b>sock "+typ+"</b>:"+log+"<br/>");
}

function recvLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	$("#recv").append("<b>sock "+typ+"</b>:"+log+"<br/>");
}

function sendGame(category,method,data) {
	var dd = new Date();
	var ts = dd.getTime();
	var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':1};
	gameSocket.send(JSON.stringify(packet));
	packetId++;
	sendLog("game",packet);
}

var User = function(uid){
	this.uid = uid;
}
User.prototype.onGameMsg_login = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","logined!");
	sendGame('game','joinTable',{prefer:0})
}
User.prototype.onGameMsg_unknown = function(category,method,data,ts,packetId,ret) {
	recvLog("game","unkonwn package!!!");
}

var Game = function(tableId){
	this.tableId = tableId;
}

user = new User(21);

// Write your code in the same way as for native WebSocket:
var lobbySocket = new WebSocket("ws://127.0.0.1:3000");
lobbySocket.onopen = function() {
	consoleLog("lobby","open");
	sendLobby('user','login',{uid:user.uid})
};
lobbySocket.onmessage = function(e) {
// Receives a message.
	recvLog("lobby",e.data);
};
lobbySocket.onclose = function() {
	consoleLog("lobby","closed");
};

var gameSocket = new WebSocket("ws://127.0.0.1:3010");
gameSocket.onopen = function() {
	consoleLog("game","open");
	sendGame('user','login',{uid:user.uid})
};
gameSocket.onmessage = function(e) {
	recvLog("game",e.data);
	var msg = JSON.parse(e.data);
	if (msg.c == "user") {
		if (typeof(user["onGameMsg_"+msg.m])=="undefined") {
			user.onMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
		} else {
			user["onGameMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
		}
	}
};
gameSocket.onclose = function() {
	consoleLog("game","closed");
};


