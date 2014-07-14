var BaseServer = require('framework/base/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	login : function(uid,userSession) {
		this._super(uid,userSession);
		//rpc call lobby that user is in here, don't let him go anywhere else
		//or use redis????
	},
	st_ser_change : function(money) {
		//记录输赢
	}
	
});
module.exports = GameServer;