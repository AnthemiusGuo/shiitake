var BaseUser = Class.extend({
	init : function(uid) {
		this.isConnect = false;
		this.uid = uid;
		this.id = uid;
		this.supportZipSignal = false;
		this.userInfo = null;
		this.gameId = 0;
		this.client = null;
		this.disConnectTime = 0;
	},
	onCloseSocket: function() {
		this.disConnectTime = utils.getNowTS();
		this.isConnect = false;
		this.client = null;
	},
	onConnect : function(client) {
		this.client = client;
		this.isConnect = true;
		this.disConnectTime = 0;
	},
	directSend : function(packet) {
		this.client.directSend(packet);
	},
	send : function(category,method,ret,packetId,data) {
		this.client.send(category,method,ret,packetId,data);
	},
	sendErr : function(errorId,errorInfo,packetId) {
		this.client.sendErr(errorId,errorInfo,packetId);
	},
	sendAckErr : function(cate,method,errorId,errorInfo,packetId) {
		this.client.sendAckErr(cate,method,errorId,errorInfo,packetId);
	},
	sendErrPackFormat: function(packetId) {
		this.client.sendErrPackFormat(packetId);
	},
	kickUser : function(cause) {
		if (cause=="sameUser") {
			this.sendErr(-8999,"您的帐号已经在其他地方登录, 您已经被踢下线。");
		} else if (cause=="serverNotReady") {
			this.sendErr(-8998,"服务器尚未准备好,请稍后重试!");
		}
		
		this.closeSocket();
		this.isConnect = false;
		//kick 后并不立刻删除本对象，只是置为不连接。
		//因为 table 中可能这个用户对象还在使用，在 table 本局结束后再遍历所有 null 的对象，等待 GC 回收内存。
		
	},
	closeSocket : function(){
		if (this.client) {
			this.client.closeSocket();
			this.client = null;
		}
	},
	onGetUserInfo: function(){
		//防出错
		utils.PLEASE_OVERWRITE_ME();
	}
});

module.exports = BaseUser;