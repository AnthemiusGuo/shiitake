var rpcServer = Class.extend({
	// constructor
	//"runTyp":"web",
	// "rpcMode":"upstream",
	// "rpcProtocol":"web",
	// "serverList" : {
	// 	"main":{"id":"main","url":"http://127.0.0.1"}
	// }
	init : function (typ,serverConfigs){
		
		console.log("create rpc for "+typ)
		this.typ = typ;
		this.runTyp = serverConfigs.runTyp;
		this.rpcMode = serverConfigs.rpcMode;
		this.rpcProtocol = serverConfigs.rpcProtocol;
		
	}
});

module.exports = rpcServer;