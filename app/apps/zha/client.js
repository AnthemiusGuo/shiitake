var BaseClient = require('framework/base/baseClient');
var ZhaClient = BaseClient.extend({
	init : function(socket) {
		this._super(socket);
		this.credits = 0;
		this.reset();
	},
	login : function(uid) {
		this.isLogined = true;
		this.uid = uid;
	},
	joinTable : function(table) {
		this.table = table;
	},
	onGetUserInfo : function() {
		//缓存用户的钱,用于压注校验
		this.credits  = this.userInfo.credits;
	},
	reset : function(){
		this.bet_info = [0,0,0,0];
		this.matchId_has_bet = 0;
	}
});
module.exports = ZhaClient;