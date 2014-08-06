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
var GAME_ID = 1;
var packetId = 0;
var uid = 21;
var webUrl = "http://127.0.0.1/shiitake/shiitake/web_demo/server.php";

function rand(min, max) {
  //  discuss at: http://phpjs.org/functions/rand/
  // original by: Leslie Hoare
  // bugfixed by: Onno Marsman
  //        note: See the commented out code below for a version which will work with our experimental (though probably unnecessary) srand() function)
  //   example 1: rand(1, 1);
  //   returns 1: 1

  var argc = arguments.length;
  if (argc === 0) {
    min = 0;
    max = 2147483647;
  } else if (argc === 1) {
    throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var PokerUtils = {};
var ConfigNames = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
var ConfigHua = ["黑桃","红桃","梅花","方块","王"];
var ConfigMen = ["天","地","玄","黄"];
var ConfigTyp = ["","散牌","对子","顺子","金花","同花顺","豹子"];

PokerUtils.getPokerInfoBy54 = function(pokerIn54){
	//0-12 0:黑桃,13-25 1:红桃, 26-38 2:梅花 39-51 3:方块
	//52 4:小王 53 4:大王 
	if (pokerIn54==52){
		return {typ:4,dianshu:1,mian:"小王",hua:ConfigHua[4]};
	} else if (pokerIn54==53) {
		return {typ:4,dianshu:2,mian:"大王",hua:ConfigHua[4]};
	} else {
		var typ = Math.floor(pokerIn54 /13);
		var value = pokerIn54%13;
		return {typ:typ,dianshu:value,mian:ConfigNames[value],hua:ConfigHua[typ]};
	}
}

PokerUtils.getPoker54ByInfo = function(pokerInfo){
	//0-12 0:黑桃,13-25 1:红桃, 26-38 2:梅花 39-51 3:方块
	//52 4:1 小王 53 4:2 大王 
	if (pokerInfo.typ==4){
		return 52+pokerInfo.value -1;
	} else {
		return pokerInfo.typ*13+pokerInfo.value;
	}
}

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
var recvCounter = 0;
function recvLog(typ,msg) {
	if (typeof(msg)=="object") {
		var log = JSON.stringify(msg);
	} else {
		var log = msg;
	}
	if (recvCounter>10){
		$("#recv").html("");
		recvCounter = 0;
	}
	$("#recv").append("<b>sock "+typ+"</b>:"+log+"<br/>");
	recvCounter++;
}

function sendGame(category,method,data) {
	data.gameId = GAME_ID;
	sendLobby(category,method,data) ;
	// var dd = new Date();
	// var ts = dd.getTime();
	// var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':1};
	// gameSocket.send(JSON.stringify(packet));
	// packetId++;
	// sendLog("game",packet);
	// consoleLog("game","send "+category+" "+method);
}

var User = function(uid){
	this.uid = uid;
}
User.prototype.onUserMsg_loginAck = function(category,method,data,ts,packetId,ret) {
	consoleLog("lobby","logined!");
	
}
User.prototype.onUserMsg_roomListNot = function(category,method,data,ts,packetId,ret) {
	consoleLog("lobby","room list!");
	for (var k in data.roomList){
		var v =  data.roomList[k];
		consoleLog("lobby","room id:"+v.roomId+";roomName:"+v.room_name+";room Desc:"+v.room_desc+";online:"+v.online);
	}
	sendGame('game','enterGameReq',{roomId:10,gameId:GAME_ID})
}


User.prototype.onUserMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("lobby","unkonwn package!!!");
}

var Table = function(tableId){
	this.tableId = tableId;
}
Table.prototype.onGameMsg_StartNot = function(category,method,data,ts,packetId,ret) {
	$("#console").html("");
	$("#send").html("");
	consoleLog("game","开始洗牌/摇骰子");
	// sendGame('game','joinTable',{prefer:0})
}

Table.prototype.onGameMsg_InBetNot = function(category,method,data,ts,packetId,ret) {
	if (ret<0) {

	} else {
		$("#men1 .total").html(data.total_bet_info[0]);
		$("#men2 .total").html(data.total_bet_info[1]);
		$("#men3 .total").html(data.total_bet_info[2]);
		$("#men4 .total").html(data.total_bet_info[3]);
	}
}

Table.prototype.onGameMsg_betAck = function(category,method,data,ts,packetId,ret) {
	// {"c":"table","m":"betAck","d":{"total_bet_info":[0,0,2114,0],"my_bet_info":[0,0,2114,0]},"t":1405327264434,"s":3,"r":1}
	if (ret<0) {

	} else {
		$("#men1 .total").html(data.total_bet_info[0]);
		$("#men2 .total").html(data.total_bet_info[1]);
		$("#men3 .total").html(data.total_bet_info[2]);
		$("#men4 .total").html(data.total_bet_info[3]);

		$("#men1 .my").html(data.my_bet_info[0]);
		$("#men2 .my").html(data.my_bet_info[1]);
		$("#men3 .my").html(data.my_bet_info[2]);
		$("#men4 .my").html(data.my_bet_info[3]);
	}
	
	// sendGame('game','joinTable',{prefer:0})
}

Table.prototype.onGameMsg_joinNot = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","广播:玩家"+data.userInfo.uname+"加入游戏");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_WaitBetNot = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","请下注");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_WaitOpenNot = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","等待开牌");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_AfterOpenNot = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","开牌展示!");
	// sendGame('game','joinTable',{prefer:0})
}
Table.prototype.onGameMsg_OpenNot = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","开牌!");
	// sock game:{"c":"table","m":"OpenNot","d":{"zhuang":{"c":0,"get_exp":0,"cc":[0,0,0,0]},"r":{"0":{"p":[26,13,41],"r":0,"t":2},"1":{"p":["10","6","34"],"r":0,"t":1},"2":{"p":["14","23","8"],"r":0,"t":1},"3":{"p":[40,18,5],"r":1,"t":2},"4":{"p":[9,48,36],"r":1,"t":2}}},"t":1405324469791,"s":0,"r":1}
	var str = "";
	for (var k in data.r[0].p) {
		var ppp = PokerUtils.getPokerInfoBy54(data.r[0].p[k]);
		str = str + " , "+ppp.hua+ppp.mian;
	};
	$("#zhuang .pai").html(str);
	$("#zhuang .px").html(ConfigTyp[data.r[0].t]);

	str = "";
	var configWL = ["负","胜"];
	for (var k in data.r[1].p) {
		var ppp = PokerUtils.getPokerInfoBy54(data.r[1].p[k]);
		str = str + " , "+ppp.hua+ppp.mian;
	};
	$("#men1 .pai").html(str);
	$("#men1 .px").html(ConfigTyp[data.r[1].t]);
	$("#men1 .wl").html(configWL[data.r[1].r]);

	str = "";
	for (var k in data.r[2].p) {
		var ppp = PokerUtils.getPokerInfoBy54(data.r[2].p[k]);
		str = str + " , "+ppp.hua+ppp.mian;
	};
	$("#men2 .pai").html(str);
	$("#men2 .px").html(ConfigTyp[data.r[2].t]);
	$("#men2 .wl").html(configWL[data.r[2].r]);

	str = "";
	for (var k in data.r[3].p) {
		var ppp = PokerUtils.getPokerInfoBy54(data.r[3].p[k]);
		str = str + " , "+ppp.hua+ppp.mian;
	};
	$("#men3 .pai").html(str);
	$("#men3 .px").html(ConfigTyp[data.r[3].t]);
	$("#men3 .wl").html(configWL[data.r[3].r]);

	str = "";
	for (var k in data.r[4].p) {
		var ppp = PokerUtils.getPokerInfoBy54(data.r[4].p[k]);
		str = str + " , "+ppp.hua+ppp.mian;
	};
	$("#men4 .pai").html(str);
	$("#men4 .px").html(ConfigTyp[data.r[4].t]);
	$("#men4 .wl").html(configWL[data.r[4].r]);


	if (typeof(data.me)!="undefined"){
		consoleLog("game","我的下注");
		consoleLog("game","天:"+data.me.cc[0]+
						"; 地:"+data.me.cc[1]+
						"; 玄:"+data.me.cc[2]+
						"; 黄:"+data.me.cc[3]);
		consoleLog("game","收入:"+data.me.c+"; 经验:"+data.me.get_exp);
	}
}

Table.prototype.onGameMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","unkonwn package!!!");
}

var Game = function(tableId){
	this.tableId = tableId;
}
Game.prototype.onGameMsg_joinTableAck = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","加入牌局/牌桌 : "+data.tableId);
}
Game.prototype.onGameMsg_unknown = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","unkonwn package!!!");
}
Game.prototype.onGameMsg_enterGameAck = function(category,method,data,ts,packetId,ret) {
	consoleLog("game","enter Game!");
	sendGame('game','joinTableReq',{gameId:GAME_ID,prefer:data.tableId})
}


user = new User(uid);
table = new Table(1);
game = new Game(1);
var lobbySocket;
var gameSocket;
var ticket = "";

$.getJSON(webUrl+"?m=user&a=login&uid="+uid,function(json){
	// Write your code in the same way as for native WebSocket:
	if (json.ret!=1) {
		consoleLog("web","login failed!!!");
		return;
	}
	ticket = json.data.ticket;
	lobby = json.data.lobby;
	lobbySocket = new WebSocket("ws://"+lobby.host+":"+lobby.clientPort);
	lobbySocket.onopen = function() {
		consoleLog("lobby","open");
		sendLobby('user','loginReq',{uid:user.uid,ticket:ticket,from:GAME_ID})
	};
	lobbySocket.onmessage = function(e) {
	// Receives a message.
		recvLog("game",e.data);
		var msg = JSON.parse(e.data);
		if (msg.r<0) {
			consoleLog("game",'<span class="red">'+msg.d.e+'</span>');
			return;
		} 
		if (msg.c == "user") {
			if (typeof(user["onUserMsg_"+msg.m])=="undefined") {
				user.onUserMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			} else {
				user["onUserMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
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
				game.onGameMsg_unknown(msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			} else {
				game["onGameMsg_"+msg.m](msg.c,msg.m,msg.d,msg.t,msg.s,msg.r);
			}
		}
	};
	lobbySocket.onclose = function() {
		consoleLog("lobby","closed");
	};
});

function send_bet(){
	var data = {men:rand(1,4),point:rand(1000,4000)};
	consoleLog("game","压注:"+ConfigMen[data.men-1]+":"+data.point);
	sendGame('table','betReq',data)
}

function ask_zhuang(){
	sendGame('table','askZhuangReq',{})
}

setInterval(function(){
	$.getJSON(webUrl+"?m=user&a=refresh&uid="+uid,function(json){
		if (typeof(json.data.ticket)!="undefined"){
			ticket = json.data.ticket;	
		}
	});
},180000)