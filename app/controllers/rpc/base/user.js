var BaseController = require("framework/base/baseController");
var ClientCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},	
	batchReload : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["uids"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//初始化服务器信息
		this.app.batchReload(data.uids);
	},
});

module.exports = ClientCtrller;