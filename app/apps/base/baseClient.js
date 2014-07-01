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
});

module.exports = BaseClient;