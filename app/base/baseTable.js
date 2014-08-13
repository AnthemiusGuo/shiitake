var Table = Class.extend({
	init : function(tableId,roomConfig) {
		utils.PLEASE_OVERWRITE_ME();
	},
	run : function() {
		
	},
	onJoinTable : function(user) {
		utils.PLEASE_OVERWRITE_ME();
	},
	//主动离桌,或主动踢人
	onLeaveTable : function(user) {
		utils.PLEASE_OVERWRITE_ME();
	},
	//断线,如果尚未离桌再调用离桌
	onDisConnectUser : function(user) {
		
	},
	doBroadcast : function(category,method,data) {
		logger.debug("doBroadcast",category,method);
		var targetUids = [];
		for (var uid in this.userList) {
			if (this.userList[uid]==null) {
				continue;
			}
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				continue;
			}
			if (logicApp.uidUserMapping[uid].isConnect) {
				targetUids.push(uid);
			}
		}
		rpc.typBroadcastCall("lobby","broadcast","list",{uids:targetUids,info:{c:category,m:method,d:data}})
	},
	doOptBroadcast : function(category,method,data,highPriority) {
		var now = new Date().getTime();
		if (now - this.worldChatLastSend>2000 || highPriority) {
			this.doBroadcast(category,method,data);
			this.worldChatLastSend = now;
		}
		//广播类，2秒钟最多一个，多了不广播;高优先级强制广播
	},
	doSinglecast : function(uid,category,method,data) {
		logicApp.doSinglecast(uid,category,method,data);
	},
	doBroadcastWithFilter : function(category,method,data,filterData) {
		//下發的是全部用戶的信息，lobby根據filterkey字段，將每個用戶自己的信息下發給自己的用戶
		logger.debug("doBroadcast",category,method);
		var targetUids = [];
		for (var uid in this.userList) {
			if (this.userList[uid]==null) {
				continue;
			}
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				continue;
			}
			if (logicApp.uidUserMapping[uid].isConnect) {
				targetUids.push(uid);
			}
		}
		rpc.typBroadcastCall("lobby","broadcast","filter",{uids:targetUids,info:{c:category,m:method,d:data},filterData:filterData})
	},
	doRpcToMultiLobbies : function(category,method,uids,data) {

		logger.debug("doBroadcast",category,method);
		var targetUids = [];
		var targetLoobies = [];
		for (var k in uids) {
			var uid = uids[k];
			
			if (this.userList[uid]==null) {
				continue;
			}
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				continue;
			}
			if (!F.isset(logicApp.uidLobbyIdMapping[uid])) {
				continue;
			}
			if (logicApp.uidUserMapping[uid].isConnect) {
				targetUids.push(uid);
			}
			targetLoobies.push(logicApp.uidLobbyIdMapping[uid]);

		}
		rpc.typMulticastCall("lobby",category,method,targetLoobies,data);
	},
	arrange_user_list: function(){
		utils.PLEASE_OVERWRITE_ME();
	}
});
module.exports = Table;