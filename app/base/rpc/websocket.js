var RpcServer = require('app/base/rpc/rpcServer');
var WebSocketRPC = RpcServer.extend({
	init : function (typ,serverConfigs){		
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;
	}
});
module.exports = WebSocketRPC;