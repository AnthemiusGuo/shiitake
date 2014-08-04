var rpcCaller = Class.extend({
	// constructor
	//"runTyp":"web",
	// "rpcMode":"upstream",
	// "rpcProtocol":"web",
	// "serverList" : {
	// 	"main":{"id":"main","url":"http://127.0.0.1"}
	// }
	init : function (typ,serverConfigs) {
		
		logger.info("create rpc for "+typ)
		this.typ = typ;
		this.runTyp = serverConfigs.runTyp;
		this.rpcMode = serverConfigs.rpcMode;
		this.rpcProtocol = serverConfigs.rpcProtocol;
		this.rpcMustConnect = serverConfigs.rpcMustConnect;
		this.requestQueue = {};
		this.requestId = 0;
		this.allReady = false;
	},
	run : function(method,id,params){
		logger.trace(method,id,params);
	}
});

module.exports = rpcCaller;