var BaseServer = require('framework/base/baseApp');
var LobbyServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.onlineUsers = {};
	},
	doLogin : function(uid,userSession,packetId) {
		//用户密码并非这里校验, 使用web校验, 所以这里需要校验web生成的ticket
		
		if (F.isset(this.userSocketManager.idClientMapping[uid])) {
			this.userSocketManager.idClientMapping[uid].kickUser();
		}
		this.onlineUsers[uid] = userSession;
		//获取用户信息
		dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
			if (ret>0) {
				this.userSocketManager.idClientMapping[uid] = userSession;
				userSession.isLogined = true;
				userSession.id = uid;
				userSession.uid = uid;
				userSession.userInfo = data;
				userSession.onGetUserInfo();
				userSession.send("user","loginAck",1,packetId,data)
			} else {
				userSession.send("user","loginAck",ret,packetId,{e:"登录失败"})
			}
		}.bind(this));
	},
	_genTicket : function(uid){

		var now = new Date().getTime();

	}
});
module.exports = LobbyServer;