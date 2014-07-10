var RpcManager = Class.extend({
	init : function (servers,skipTyp){
		this.rpcServers = {};
		for (var serverTyp in servers) {
		    if (serverTyp === skipTyp) {
		        continue;
		    }
		    if (servers[serverTyp].rpcProtocol!="none") {
		    	var RpcServer = require('app/rpc/'+servers[serverTyp].rpcMode);
			    var thisServer = new RpcServer(serverTyp,servers[serverTyp]);    
			    this.rpcServers[serverTyp] = thisServer;
			    this.rpcServers[serverTyp].connect();
		    }
		}
		this.allReady = false;
	},
	checkRPCReady : function(){
		this.allReady = true;
		for (var serverTyp in this.rpcServers) {
		    if (this.rpcServers[serverTyp].allReady==false && this.rpcServers[serverTyp].rpcMustConnect) {
		    	this.allReady = false;
		    	logger.info("RpcManager:"+serverTyp+" not ready!!");
		    	break;
		    }
		}
		if (this.allReady) {
			logger.info("All Must Connect RPC server Ready!!");
		}
	},
	//typ: 类似lobby,zha,之类的远程调用
	//method: 调用方法名
	//id: 如果这个rpc需要负载均衡,这个id用于命中负载均衡器
	//params: 参数
	run : function(typ,category,method,id,params){
		this.rpcServers[typ].runCommnd(category,method,id,params);
	}
});

module.exports = RpcManager;