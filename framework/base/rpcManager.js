var RpcManager = Class.extend({
	init : function (servers,skipTyp){
		this.rpcCallers = {};
		for (var serverTyp in servers) {
		    if (serverTyp === skipTyp) {
		        continue;
		    }
		    if (servers[serverTyp].rpcProtocol!="none") {
		    	var RpcCaller = require('app/rpc/'+servers[serverTyp].rpcMode);
			    var thisServer = new RpcCaller(serverTyp,servers[serverTyp]);    
			    this.rpcCallers[serverTyp] = thisServer;
			    this.rpcCallers[serverTyp].connect();
		    }
		}
		this.allReady = false;
	},
	checkRPCReady : function(){
		this.allReady = true;
		for (var serverTyp in this.rpcCallers) {
		    if (this.rpcCallers[serverTyp].allReady==false && this.rpcCallers[serverTyp].rpcMustConnect) {
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
	call : function(typ,category,method,id,params){
		for (var serverTyp in this.rpcCallers) {
		    this.rpcCallers[typ].callCommand(category,method,id,params);
		}
	},
	broadcastCall : function(category,method,params){
		this.rpcCallers[typ].callCommand(category,method,{broadcast:true},params);
	},
	typBroadcastCall : function(typ,category,method,params){
		this.rpcCallers[typ].callCommand(category,method,{broadcast:true},params);
	},
});

module.exports = RpcManager;