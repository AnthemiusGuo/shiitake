var RpcServer = require('framework/rpc/websocket');
var RobotRPC = RpcServer.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
		this.serverForTyps = {};
		for (var k in this.allServers) {
			this.serverForTyps[this.allServers[k].for] = k;
		}
	},
	findServerByParam: function(param){

	}
});
module.exports = RobotRPC;