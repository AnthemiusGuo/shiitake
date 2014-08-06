var BaseRPCRouter = require('framework/router/rpcRouter');
var RPCRouter = BaseRPCRouter.extend({
	on_msg_broadcast_list : function(clientSession,ret,ts,data,packetSerId) {
		logger.info("on_msg_broadcast_list",data);
		if (F.isset(this["handle_data_"+data.info.c+"_"+data.info.m])){
			data.info.d = this["handle_data_"+data.info.c+"_"+data.info.m](data.info.d);
		}
		for (var k in data.uids) {
			var uid = data.uids[k];
			if (!F.isset(logicApp.uidUserMapping[uid])) {
				logger.info("this user no in this lobby",uid)
				continue;
			}
			var userSession = logicApp.uidUserMapping[uid];
			userSession.send(data.info.c,data.info.m,1,0,data.info.d);
		}
	},
	on_msg_singlecast_user : function(clientSession,ret,ts,data,packetSerId) {
		if (F.isset(this["handle_data_"+data.info.c+"_"+data.info.m])){
			data.info.d = this["handle_data_"+data.info.c+"_"+data.info.m](data.info.d);
		}
		var uid  = data.uid
		if (!F.isset(logicApp.userSocketManager.idClientMapping[uid])) {
			return;
		}
		var userSession = logicApp.userSocketManager.idClientMapping[uid];
		userSession.send(data.info.c,data.info.m,1,0,data.info.d);
	},
	handle_data_table_joinNot : function(data){
		var uid = data.uid;
		if (!F.isset(logicApp.uidUserMapping[uid])) {
			return data;
		}
		data.userInfo = logicApp.uidUserMapping[uid].getUserShowInfo();
		return data;
	}
});
module.exports = RPCRouter;