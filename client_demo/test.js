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

// Write your code in the same way as for native WebSocket:
var ws = new WebSocket("ws://127.0.0.1:3000");
ws.onopen = function() {
ws.send("Hello");  // Sends a message.
};
ws.onmessage = function(e) {
// Receives a message.
	console.log(e.data);
};
ws.onclose = function() {
	alert("closed");
};
