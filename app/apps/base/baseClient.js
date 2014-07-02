var BaseClient = Class.extend({
	init : function(socket) {
		this.socket = socket;
		this.isConnect = true;
		this.isLogined = false;
		this.uid = 0;
		// this.userInfo = null;
	},
	closeSocket: function() {

	},
	send : function(socket,category,method,ret,packetId,data) {
		var ts =  new Date().getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		this.socket.send(JSON.stringify(packet));
	},
});

module.exports = BaseClient;