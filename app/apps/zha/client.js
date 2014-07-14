var BaseClient = require('framework/base/baseClient');
var ZhaClient = BaseClient.extend({
	init : function(socket) {
		this._super(socket);
		this.credits = 0;
		//机器人也是一个普通用户链接
		this.is_robot = 0;
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
	},
	writeBackChangeUserInfo : function() {
		//this.userInfo.exp += exp;
		//数据写回

		//rpc通知lobby的部分由table逻辑统一发送,为了节约信令
		//最完美的写法应该是这里采用batch缓存通知,table调用flush将batch缓存一次性打包发送.

	},
});
module.exports = ZhaClient;