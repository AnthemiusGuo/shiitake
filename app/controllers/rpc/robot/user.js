var BaseController = require("app/controllers/rpc/base/user");
var ClientCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},	
	join : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["count","tableId","serverId","ticket"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//初始化服务器信息
		this.app.askRobotJoin(data.serverId,data.tableId,data.ticket,data.count);
	},
	joinAndAskZhuang : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["count","tableId","serverId","ticket"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//初始化服务器信息
		this.app.askRobotZhuang(data.serverId,data.tableId,data.ticket,data.count);
	},
});

module.exports = ClientCtrller;