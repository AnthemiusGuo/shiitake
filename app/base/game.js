var BaseServer = require('framework/base/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	run : function(method,id,params) {
		
	},
	login : function(uid,userSession) {
		this._super(uid,userSession);
		//rpc call lobby that user is in here, don't let him go anywhere else
		//or use redis????
	}
	
});
module.exports = GameServer;