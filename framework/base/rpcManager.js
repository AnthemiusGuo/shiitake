var RpcManager = Class.extend({
	init : function (servers,skipTyp){
		this.rpcCallers = {};
		this.allRPCServers = {};
		for (var serverTyp in servers) {
		    if (serverTyp === skipTyp) {
		        continue;
		    }
		    if (servers[serverTyp].rpcProtocol!="none") {
		    	var RpcCaller = require('app/rpc/'+servers[serverTyp].rpcMode);
			    var thisServer = new RpcCaller(serverTyp,servers[serverTyp]);    
			    this.rpcCallers[serverTyp] = thisServer;
			    this.rpcCallers[serverTyp].connect();
			    for (var id in servers[serverTyp].serverList){
			    	this.allRPCServers[id] = serverTyp;
			    }
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
	call : function(typ,category,method,id,params,cb){
		//hack for fake lobby (as robot and so on)
		if (F.isset(id.serverId) &&  F.isset(config.fakeLobbyApp)) {
			if (F.isset(config.fakeLobbyApp[this.allRPCServers[id.serverId]])){
				typ = this.allRPCServers[id.serverId];
			}
		}
		
	    var ret = this.rpcCallers[typ].callCommand(category,method,id,params,cb);
	    logger.debug("rpc call ret:",ret);
	    if (ret[0]<0) {
	    	if (F.isset(cb)) {
    			cb(category,method,ret[0],ret[1],ret[2]);
    		}
	    } 
	},
	broadcastCall : function(category,method,params){
		for (var typ in this.rpcCallers) {
		    this.rpcCallers[typ].callCommand(category,method,{broadcast:true},params);
		}
	},
	typBroadcastCall : function(typ,category,method,params){
		this.rpcCallers[typ].callCommand(category,method,{broadcast:true},params);
		if (typ=="lobby" && F.isset(config.fakeLobbyApp)){
    		for (var newTyp in config.fakeLobbyApp) {
    			this.rpcCallers[newTyp].callCommand(category,method,{broadcast:true},params);
    		}
    	}
	},
	typMulticastCall : function(typ,category,method,serverIds,params){
		this.rpcCallers[typ].callCommand(category,method,{multicast:true,serverIds:serverIds},params);
		if (typ=="lobby" && F.isset(config.fakeLobbyApp)){
    		for (var newTyp in config.fakeLobbyApp) {
    			this.rpcCallers[newTyp].callCommand(category,method,{multicast:true,serverIds:serverIds},params);
    		}
    	}
	},
});

module.exports = RpcManager;