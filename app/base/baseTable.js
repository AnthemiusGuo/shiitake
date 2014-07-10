var Table = Class.extend({
	init : function(tableId,roomConfig) {
		this.tableId = tableId;
		this.roomConfig = roomConfig;
		this.state = "init";
		this.userList = {};
		this.userCounter = 0;
		this.worldChatQueue = [];
		this.worldChatLastSend = 0;
	},
	run : function() {
		
	},
	onJoinTable : function(userSession) {
		logger.debug("user "+userSession.uid+" join the table");
		this.userList[userSession.uid] = userSession;
		this.userCounter = Object.keys(this.userList).length;
	},
	//主动离桌,或主动踢人
	onLeaveTable : function(userSession) {
		
	},
	//断线,如果尚未离桌再调用离桌
	onDisConnectUser : function(userSession) {
		
	},
	doBroadcast : function(category,method,ret,packetId,data) {
		for (var k in this.userList) {
			this.userList[k].send(category,method,ret,packetId,data);
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
		//清理内存
	}
});
module.exports = Table;