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
	consoleLog("game","send "+category+" "+method);
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

var Table = function(tableId){
	this.tableId = tableId;
}
Table.prototype.onGameMsg_Start = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","开始洗牌/摇骰子");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_join = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","广播:玩家"+data.uname+"加入游戏");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_WaitBet = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","请下注");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_WaitOpen = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","等待开牌");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_AfterOpen = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","开牌展示!");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","unkonwn package!!!");
}

var Game = function(tableId){
	this.tableId = tableId;
}
Game.prototype.onGameMsg_joinTable = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","加入牌局/牌桌 : "+data.tableId);
}
Game.prototype.onGameMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","unkonwn package!!!");
}

user = new User(21);
table = new Table(1);
game = new Game(1);
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
	} else if (msg.c == "error") {
		consoleLog("game",'<span class="red">'+msg.d.e+'</span>');
	} else if (msg.c == "table") {
		if (typeof(table["onGameMsg_"+msg.m])=="undefined") {
			table.onMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
		} else {
			table["onGameMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
		}
	} else if (msg.c == "game") {
		if (typeof(game["onGameMsg_"+msg.m])=="undefined") {
			game.onMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
		} else {
			game["onGameMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
		}
	}
};
gameSocket.onclose = function() {
	consoleLog("game","closed");
};

function send_bet(){
	sendGame('table','bet',{men:1,point:1000})
}
