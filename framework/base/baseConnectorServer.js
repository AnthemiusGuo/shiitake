var BaseServer = require('app/base/baseApp');
var ConnectorServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.onlineUsers = {};
        this.onlineUserCount = 0;
        this.gameServers = {};
        for (var k in config.servers) {
            var v = config.servers[k];
            if (v.rpcMode != "game") {
                continue;
            }
            this.gameServers[k] = {};
            for (var x in v.serverList) {
                var y = v.serverList[x];
                //lb is short for load balance
                this.gameServers[k][x] = {status:-1,lb:{balance:0,capability:y.cap},lastPing:0};
            }
        }
	},
	rpc_ping : function(typ,id,data) {
        var ts =  new Date().getTime();
        //检查是否是游戏服务器
        if (F.isset(this.gameServers[typ]) && F.isset(this.gameServers[typ][id])) {
            this.gameServers[typ][id].lastPing = ts;
            this.gameServers[typ][id].lb.balance = data.balance;

        }

    },
    onGameServerReady : function(data) {
        //检查是否是游戏服务器
        if (F.isset(this.gameServers[data.typ]) && F.isset(this.gameServers[data.typ][data.id])) {
            this.gameServers[data.typ][data.id].status = 1;
            this.gameServers[typ][id].lb.balance = data.balance;
        }
    },
	_genTicket : function(uid){

		var now = new Date().getTime();

	}
});
module.exports = ConnectorServer;