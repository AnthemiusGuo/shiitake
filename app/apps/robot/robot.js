var BaseServer = require('app/apps/base/baseApp');
var RobotServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	run : function(method,id,params) {
		
	}
});
module.exports = RobotServer;