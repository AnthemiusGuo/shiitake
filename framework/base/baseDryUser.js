var BaseDryUser = Class.extend({
	init : function(lobbyId,rpcSession) {
		this.lobbyId = lobbyId;
		this.rpcSession = rpcSession;
		this.isConnect = true;
		this.uid = 0;
		this.userInfo = null;
	},
	onCloseSocket: function() {
		this.isConnect = false;
		this.rpcSession = null;
	},
	send : function(category,method,ret,packetId,data) {
		if (this.isConnect==false || !F.isset(this.rpcSession)){
			logger.error("not connect!!");
			return;
		}
		var ts =  new Date().getTime();
		if (!F.isset(data.uid)) {
			data.uid = this.uid;
		}
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':packetId,'r':ret};
		this.rpcSession.directSend(packet);
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
	
	closeSocket : function(){
		if (this.rpcSession) {
			this.rpcSession.close();
		}
		this.onCloseSocket();
	},
	getUserShowInfo : function() {
		if (!F.isset(this.userInfo)){
			//返回错误信息
			return {
				uid : this.userInfo.uid,
				uname : '[未知]',
				avatar_url : '',
				avatar_id : 0,
				level : 0,
				vip_level: 0
			}

		}
		return {
			uid : this.userInfo.uid,
			uname : this.userInfo.uname,
			avatar_url : this.userInfo.avatar_url,
			avatar_id : this.userInfo.avatar_id,
			level : this.userInfo.level,
			vip_level: this.userInfo.vip_level,
		}
	},
	onGetUserInfo: function(){
		//防出错
		utils.PLEASE_OVERWRITE_ME();
	}
});

module.exports = BaseDryUser;