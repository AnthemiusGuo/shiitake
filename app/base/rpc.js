var rpc = Class.extend({
	init : function (servers,skipTyp){
		this.rpcServers = {};
		for (var serverTyp in servers) {
		    if (serverTyp === skipTyp) {
		        continue;
		    }
		    var RpcServer = require('app/rpc/'+servers[serverTyp].rpcMode);
		    var thisServer = new RpcServer(serverTyp,servers[serverTyp]);    
		    this.rpcServers[serverTyp] = thisServer;
		}
	},
	//typ: 类似lobby,zha,之类的远程调用
	//method: 调用方法名
	//id: 如果这个rpc需要负载均衡,这个id用于命中负载均衡器
	//params: 参数
	run : function(typ,method,id,params){
		this.rpcServers[typ].run(method,id,params);
	}
});

module.exports = rpc;