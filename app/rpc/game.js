var RpcServer = require('./base/rpcServer');
var LobbyRPC = RpcServer.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
	}
});
module.exports = LobbyRPC;