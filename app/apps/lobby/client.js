var BaseClient = require('app/apps/base/baseClient');
var LobbyClient = BaseClient.extend({
	init : function(socket) {
		this._super(socket);
	},
	login : function(uid) {
		this.isLogined = true;
		this.uid = uid;
	}
});
module.exports = LobbyClient;