var BaseServer = require('app/apps/base/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	run : function(method,id,params) {
		
	}
});
module.exports = GameServer;