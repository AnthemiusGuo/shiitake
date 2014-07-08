var BaseClient = require('app/apps/base/baseClient');
var RpcClient = BaseClient.extend({
	init : function(socket) {
		this._super(socket);
	},
	login : function(serverId) {
		this.isLogined = true;
		this.serverId = serverId;
	}
});
module.exports = RpcClient;