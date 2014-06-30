var BaseServer = require('app/apps/base/baseApp');
var LobbyServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	}
});
module.exports = LobbyServer;