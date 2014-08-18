var BaseRPCRouter = require('framework/router/rpcRouter');
var RPCRouter = BaseRPCRouter.extend({
	on_msg_user_join : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["count","tableId","serverId","ticket","credits_low","credits_high"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//初始化服务器信息
		this.app.askRobotJoin(data.serverId,data.tableId,data.ticket,data.count,credits_low,credits_high);
	},
	on_msg_user_joinAndAskZhuang : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["count","tableId","serverId","ticket","credits_low","credits_high"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//初始化服务器信息
		this.app.askRobotZhuang(data.serverId,data.tableId,data.ticket,data.count,credits_low,credits_high);
	},
	on_msg_broadcast_list  : function(clientSession,ret,ts,data,packetSerId) {
		var category = data.info.c;
		var method = data.info.m;
		var dd = data.info.d;

		for (var k in data.uids) {
			var uid = data.uids[k];
			if (!F.isset(logicApp.robotInfos[uid])) {
				logger.debug("this user no in this robot",uid)
				continue;
			}
			var robot = logicApp.robotInfos[uid];
			

			if (F.isset(robot['onMsg_'+category+'_'+method])) {
				robot['onMsg_'+category+'_'+method](ret,dd);
			} else {
				robot.onMsg(category,method,ret,dd);
			}
		}

	},
	on_msg_broadcast_filter: function(clientSession,ret,ts,data,packetSerId) {
		logger.debug("on_msg_broadcast_filter",data);
		var category = data.info.c;
		var method = data.info.m;
		var dd = data.info.d;
		var filterData = data.filterData;

		for (var k in data.uids) {
			var uid = data.uids[k];
			if (!F.isset(logicApp.robotInfos[uid])) {
				logger.debug("this user no in this robot",uid)
				continue;
			}
			var robot = logicApp.robotInfos[uid];
			
			for (var k2 in filterData) {
				dd[k2] = null;
				if (F.isset(filterData[k2][uid])){
					dd[k2] = filterData[k2][uid];
				}
			}

			if (F.isset(robot['onMsg_'+category+'_'+method])) {
				robot['onMsg_'+category+'_'+method](ret,dd);
			} else {
				robot.onMsg(category,method,ret,dd);
			}
		}
	},
	on_msg_singlecast_user : function(clientSession,ret,ts,data,packetSerId) {
		var category = data.info.c;
		var method = data.info.m;
		var dd = data.info.d;

		var uid = data.uid;
		if (!F.isset(logicApp.robotInfos[uid])) {
			logger.debug("this user no in this robot",uid)
			return;
		}
		var robot = logicApp.robotInfos[uid];
		
		if (F.isset(robot['onMsg_'+category+'_'+method])) {
			robot['onMsg_'+category+'_'+method](ret,dd);
		} else {
			robot.onMsg(category,method,ret,dd);
		}
	},
});
module.exports = RPCRouter;