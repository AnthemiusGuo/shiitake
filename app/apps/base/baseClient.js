var BaseClient = Class.extend({
	init : function(socket) {
		this.socket = socket;
		this.isConnect = true;
		this.isLogined = false;
		this.uid = 0;
		// this.userInfo = null;
	},
	onCloseSocket: function() {

	},
	send : function(category,method,ret,packetId,data) {
		var ts =  new Date().getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		this.socket.send(JSON.stringify(packet));
	},
	sendErr : function(errorId,errorInfo,packetId) {
		if (typeof(packetId)=="undefined" || packetId===null) {
			packetId = 0;
		}
		this.send('error','packageErr',errorId,packetId,{e:errorInfo});
	},
	sendErrPackFormat: function(packetId) {
		this.sendErr(-9995,"信令格式有误",packetId);
	},
	kickUser : function() {
		this.sendErr(-9000,"您的帐号已经在其他地方登录, 您已经被踢下线。");
		this.socket.close();
		this.socket = null;
		this.isConnect = false;
		//kick 后并不立刻删除本对象，只是置为不连接。
		//因为 table 中可能这个用户对象还在使用，在 table 本局结束后再遍历所有 null 的对象，等待 GC 回收内存。
		
	}
});

module.exports = BaseClient;