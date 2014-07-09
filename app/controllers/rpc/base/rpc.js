var BaseController = require("framework/base/baseController");
var ClientCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},
	login : function(clientSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["typ","id"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//校验ticket 等，这里先省略
		
		//初始化服务器信息
		this.app.rpc_login(data.typ,data.id,clientSession,packetSerId);
	},
	ping : function(clientSession,ret,ts,data,packetSerId) {
		// { typ: 'zha', id: 'zha-server-1', serverId: 'lobby-server-1' }
		if (!utils.checkParam(data,["typ","id"])) {
			clientSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//校验ticket 等，这里先省略
		
		//初始化服务器信息
		this.app.rpc_ping(data.typ,data.id,clientSession,packetSerId);
	},
});

module.exports = ClientCtrller;