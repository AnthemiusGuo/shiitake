var RpcCaller = require('framework/rpcCaller/websocket');
var RobotRPC = RpcCaller.extend({
	init : function (typ,serverConfigs){
		this._super(typ,serverConfigs);
		this.serverForTyps = {};
		for (var k in this.allServers) {
			this.serverForTyps[this.allServers[k].for] = k;
		}
	},
	findServerByParam: function(param){
		if (F.isset(this.serverForTyps[param.forTyp])) {
			var id = this.serverForTyps[param.forTyp];
			return this.allServers[id];
		} else {
			return null;
		}
	}
});
module.exports = RobotRPC;