var BaseRPCRouter = require('framework/router/rpcRouter');
var RPCRouter = BaseRPCRouter.extend({
	on_msg_broadcast_list : function(clientSession,ret,ts,data,packetSerId) {
		for (var uid in data.uids) {
			if (!F.isset(logicApp.userSocketManager.idClientMapping[uid])) {
				continue;
			}
			var userSession = logicApp.userSocketManager.idClientMapping[uid];
			userSession.send(data.info.c,data.info.m,1,0,data.info.d);
		}
	},
	on_msg_singlecast_user : function(clientSession,ret,ts,data,packetSerId) {
		var uid  = data.uid
		if (!F.isset(logicApp.userSocketManager.idClientMapping[uid])) {
			return;
		}
		var userSession = logicApp.userSocketManager.idClientMapping[uid];
		userSession.send(data.info.c,data.info.m,1,0,data.info.d);
	},
});
module.exports = RPCRouter;