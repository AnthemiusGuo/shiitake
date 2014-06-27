var RpcServer = require('app/base/rpcServer');
var LobbyRPC = RpcServer.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;
		for (var serverName in serverConfigs.serverList) {
	        var value = serverConfigs.serverList[serverName];
	        
	    }
	},
	connentServer : function(){
		
	}
});
module.exports = LobbyRPC;