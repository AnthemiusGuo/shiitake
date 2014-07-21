var Table = Class.extend({
	init : function(tableId,roomConfig) {
		utils.PLEASE_OVERWRITE_ME();
	},
	run : function() {
		
	},
	onJoinTable : function(userSession) {
		utils.PLEASE_OVERWRITE_ME();
	},
	//主动离桌,或主动踢人
	onLeaveTable : function(userSession) {
		
	},
	//断线,如果尚未离桌再调用离桌
	onDisConnectUser : function(userSession) {
		
	},
	doBroadcast : function(category,method,ret,packetId,data) {
		for (var k in this.userList) {
			if (this.userList[k].isConnect) {
				this.userList[k].send(category,method,ret,packetId,data);
			}
		}
	},
	doOptBroadcast : function(category,method,ret,packetId,data,highPriority) {
		var now = new Date().getTime();
		if (now - this.worldChatLastSend>2000 || highPriority) {
			this.doBroadcast(category,method,ret,packetId,data);
			this.worldChatLastSend = now;
		}
		//广播类，2秒钟最多一个，多了不广播;高优先级强制广播
	},
	arrange_user_list: function(){
		utils.PLEASE_OVERWRITE_ME();
	}
});
module.exports = Table;