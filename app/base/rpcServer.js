var rpcServer = Class.extend({
	// constructor
	init : function (typ,serverConfigs){
		this.typ = typ;
		this.runTyp = serverConfigs.runTyp;
		for (var serverName in serverConfigs.serverList) {
	        var value = serversList[serverName];

	        console.log(value);
	    }
	}
});

module.exports = rpcServer;