var rpcServer = Class.extend({
	// constructor
	//"runTyp":"web",
	// "rpcMode":"upstream",
	// "rpcProtocol":"web",
	// "serverList" : {
	// 	"main":{"id":"main","url":"http://127.0.0.1"}
	// }
	init : function (typ,serverConfigs){
		
		
		this.typ = typ;
		this.runTyp = serverConfigs.runTyp;
		this.rpcMode = serverConfigs.rpcMode;
		this.rpcProtocol = serverConfigs.rpcProtocol;
		for (var serverName in serverConfigs.serverList) {
	        var value = serverConfigs.serverList[serverName];

	        console.log(value);
	    }
	}
});

module.exports = rpcServer;