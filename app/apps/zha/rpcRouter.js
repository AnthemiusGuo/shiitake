var BaseRPCRouter = require('framework/router/rpcRouter');
var RPCRouter = BaseRPCRouter.extend({

	on_msg_default_default : function(category,method,clientSession,ret,ts,data,packetSerId) {
		logger.info("category,method,clientSession,ret,ts,data,packetSerId");
		logger.info(category,method,clientSession,ret,ts,data,packetSerId);
	},
	on_msg_game_joinTableReq : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["prefer","uid"])) {
			userSession.sendErrPackFormat(packetSerId);
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
	betReq : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["men","point"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		if (!F.isset(userSession.table)){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(userSession.uid) || userSession.uid<=0){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		if (!F.isset(userSession.table.userList[userSession.uid])){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		userSession.table.onBet(userSession.uid,data.men,data.point,packetSerId);
	},
	askZhuangReq : function(userSession,ret,ts,data,packetSerId) {
		// if (!utils.checkParam(data,["men","point"])) {
		// 	userSession.sendErrPackFormat(packetSerId);
		// 	return;
		// }
		
		if (!F.isset(userSession.table)){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(userSession.uid) || userSession.uid<=0){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		if (!F.isset(userSession.table.userList[userSession.uid])){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		userSession.table.onAskZhuang(userSession.uid,data,packetSerId);
	}
});
module.exports = RPCRouter;