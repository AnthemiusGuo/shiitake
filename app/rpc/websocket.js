var RpcServer = require('app/base/rpcServer');
var WebSocketRPC = RpcServer.extend({
	init : function (typ,serverConfigs){		
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;
	}
});
module.exports = WebSocketRPC;