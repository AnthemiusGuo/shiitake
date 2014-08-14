var RpcClient = Class.extend({
	init : function(socket) {
		this.socket = socket;
		this.isConnect = true;
		this.isLogined = false;
		this.uid = 0;
		this.supportZipSignal = false;
		this.userInfo = null;
		this.gameId = 0;
		this.id = 0;

	},
	onCloseSocket: function() {
		this.isConnect = false;
	},
	directSend : function(packet) {
		if (this.isConnect==false || !F.isset(this.socket)){
			logger.error("not connect!!");
			return;
		}
		this.socket.send(JSON.stringify(packet));
	},
	send : function(category,method,ret,packetId,data) {
		logger.debug("rpc reply ",category,method,ret,data)
		if (this.isConnect==false || !F.isset(this.socket)){
			logger.error("not connect!!");
			return;
		}
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
	sendAckErr : function(cate,method,errorId,errorInfo,packetId) {
		if (typeof(packetId)=="undefined" || packetId===null) {
			packetId = 0;
		}
		this.send(cate,method,errorId,packetId,{e:errorInfo});
	},
	sendErrPackFormat: function(packetId) {
		this.sendErr(-9995,"信令格式有误",packetId);
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
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	},
	onGetUserInfo: function(){
		//防出错
		utils.PLEASE_OVERWRITE_ME();
	},
	login : function(serverId) {
		this.isLogined = true;
		this.serverId = serverId;
	}
});
module.exports = RpcClient;