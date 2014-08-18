var BaseRPCRouter = require('framework/router/rpcRouter');
var RPCRouter = BaseRPCRouter.extend({
	on_msg_broadcast_list : function(clientSession,ret,ts,data,packetSerId) {
		logger.info("on_msg_broadcast_list",data);
		if (clientSession.gameId>0){
			data.info.d.gameId = clientSession.gameId;
		}
		for (var k in data.uids) {
			var uid = data.uids[k];
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				logger.debug("this user no in this lobby",uid)
				continue;
			}
			if (!logicApp.uidUserMapping[uid].isConnect) {
				logger.debug("this user has offline",uid)
				continue;
			}
			var userSession = logicApp.uidUserMapping[uid];
			userSession.send(data.info.c,data.info.m,1,0,data.info.d);
		}
	},
	on_msg_broadcast_filter: function(clientSession,ret,ts,data,packetSerId) {
		logger.info("on_msg_broadcast_filter",data);
		if (clientSession.gameId>0){
			data.info.d.gameId = clientSession.gameId;
		}
		var filterData = data.filterData;
		for (var k in data.uids) {
			var uid = data.uids[k];
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				logger.info("this user no in this lobby",uid)
				continue;
			}
			if (!logicApp.uidUserMapping[uid].isConnect) {
				logger.debug("this user has offline",uid)
				continue;
			}
			var userSession = logicApp.uidUserMapping[uid];
			for (var k2 in filterData) {
				if (F.isset(filterData[k2][uid])){
					data.info.d[k2] = filterData[k2][uid];
				}
			}
			userSession.send(data.info.c,data.info.m,1,0,data.info.d);
		}
	},
	 
	on_msg_singlecast_user : function(clientSession,ret,ts,data,packetSerId) {
		var uid  = data.uid
		if (!F.isset(logicApp.userSocketManager.idClientMapping[uid])) {
			return;
		}
		if (clientSession.gameId>0){
			data.info.d.gameId = clientSession.gameId;
		}
		var userSession = logicApp.userSocketManager.idClientMapping[uid];
		userSession.send(data.info.c,data.info.m,1,0,data.info.d);
	},
	on_msg_batch_update : function(clientSession,ret,ts,data,packetSerId) {
		logger.info("on_msg_broadcast_list",data);
		if (clientSession.gameId>0){
			data.info.d.gameId = clientSession.gameId;
		}
		for (var k in data.uids) {
			var uid = data.uids[k];
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				logger.info("this user no in this lobby",uid)
				continue;
			}
			//

		}
	},
});
module.exports = RPCRouter;