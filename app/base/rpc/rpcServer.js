var rpcServer = Class.extend({
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
		this.requestQueue = {};
		this.requestId = 0;
	},
	run : function(method,id,params){
		logger.debug(method,id,params);
	}
});

module.exports = rpcServer;