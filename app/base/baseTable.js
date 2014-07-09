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
	}
});
module.exports = Table;