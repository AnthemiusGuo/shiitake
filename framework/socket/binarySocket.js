var net = require('net');
var BinarySocket = Class.extend({
	init : function (port){
		this.port = port;
	},
	addPackageDefine : function(newDef){

	},
	flushPackageDefine : function() {
		this.packageDef = {};
	},
	start : function(){

		this.server = net.Server(function(socket) {
			this.socket = socket;
    		socket.on('data', function(d) {

	    	});
	    });
	    this.server.listen(this.port);
});

module.exports = BinarySocket;