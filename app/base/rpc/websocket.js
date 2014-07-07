var RpcServer = require('app/base/rpc/rpcServer');
var WebSocketRPC = RpcServer.extend({
	init : function (typ,serverConfigs){		
		this._super(typ,serverConfigs);
		this.allServers = serverConfigs.serverList;
		// this.connectTick = 0;
	},
	realConnect : function() {
		logger.info("try to connect to rpc server:"+this.typ)
		for (var k in this.allServers) {
			logger.debug(this.allServers[k]);
		}
	},
	connect : function(){
		if (F.isset(this.connectTick)) {
			clearInterval(this.connectTick);			
		}
		// this.connectTick = setInterval(this.realConnect.bind(this),1000);
	}
});
module.exports = WebSocketRPC;