var BaseClient = require('framework/base/baseClient');
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