var BaseServer = require('app/app/baseApp');
var LobbyServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	run : function() {
		
	}
});
module.exports = LobbyServer;