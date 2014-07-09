var BaseClient = require('framework/base/baseClient');
var ZhaClient = BaseClient.extend({
	init : function(socket) {
		this._super(socket);
	},
	login : function(uid) {
		this.isLogined = true;
		this.uid = uid;
	},
	joinTable : function(table) {
		this.table = table;
	}
});
module.exports = ZhaClient;