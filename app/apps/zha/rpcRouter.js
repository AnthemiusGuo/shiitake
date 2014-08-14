var BaseRPCRouter = require('framework/router/rpcRouter');
var RPCRouter = BaseRPCRouter.extend({

	on_msg_default_default : function(category,method,clientSession,ret,ts,data,packetSerId) {
		logger.info("category,method,clientSession,ret,ts,data,packetSerId");
		logger.info(category,method,clientSession,ret,ts,data,packetSerId);
	},
	on_msg_game_joinTableReq : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["prefer","uid"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//进桌
		var preferTableId = data.prefer;
		var tableId = this.app.findTable(preferTableId);
		var uid = data.uid;

		logger.debug("find table ID:"+tableId);
		var ret = this.app.doJoinTable(uid,tableId);

		clientSession.send("game","joinTableAck",ret[0],packetSerId,ret[1]);

	},
	on_msg_game_leaveGameReq : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["uid"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		var uid = data.uid;

		if (!F.isset(logicApp.uidUserMapping[uid])){
			clientSession.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}

		var user = logicApp.uidUserMapping[uid];		

		var ret = this.app.doLeaveGame(uid);

		clientSession.send("game","leaveGameAck",ret[0],packetSerId,ret[1]);

	},
	on_msg_game_disconnect : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["uid"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		var uids = data.uids;
		var ret = this.app.onUserDisconnect(uids);

		clientSession.send("game","leaveTableAck",ret[0],packetSerId,ret[1]);

	},
	on_msg_table_betReq : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["men","point","uid"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}

		var uid = data.uid;

		if (!F.isset(logicApp.uidUserMapping[uid])){
			clientSession.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}

		var user = logicApp.uidUserMapping[uid];
		var tableId = user.tableId;

		logger.info("user.tableId",tableId);

		if (tableId==0 || !F.isset(logicApp.tables[user.tableId].userList[uid])){
			clientSession.sendErr(-1000,"您尚未加入任何牌桌",packetSerId);
			return;
		}
		var ret = logicApp.tables[tableId].onBet(uid,data.men,data.point);
		clientSession.send("table","betAck",ret[0],packetSerId,ret[1]);
	},
	on_msg_table_askZhuangReq : function(clientSession,ret,ts,data,packetSerId) {
		var uid = data.uid;

		if (!F.isset(logicApp.uidUserMapping[uid])){
			clientSession.sendErr(-1000,"您尚未登录游戏服务器",packetSerId);
			return;
		}

		var user = logicApp.uidUserMapping[uid];
		var tableId = user.tableId;

		logger.info("user.tableId",tableId);

		if (tableId==0 || !F.isset(logicApp.tables[user.tableId].userList[uid])){
			clientSession.sendErr(-1000,"您尚未加入任何牌桌",packetSerId);
			return;
		}
		var ret = logicApp.tables[tableId].onAskZhuang(uid,data);
		clientSession.send("table","askZhuangAck",ret[0],packetSerId,ret[1]);
	}
});
module.exports = RPCRouter;