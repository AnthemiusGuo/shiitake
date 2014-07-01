var TablePublic = require('app/apps/base/tablePublic');
var ZhaPoker = require('app/apps/zha/zhaPoker');
var Table = TablePublic.extend({
	init : function(tableId,roomConfig) {
		this._super();
		//四门押注
		this.bet_info = [0,0,0,0];
		//用户押注
		this.user_bet_info = {};
	    this.user_bet_total = 0;
	    //历史纪录
		this.his_1 = [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
	    this.his_2 =  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
	    this.his_3 =  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];
	    this.his_4 =  [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1];

	    this.zhuang = new ZhaPoker();
	    this.xian1 = new ZhaPoker();
	    this.xian2 = new ZhaPoker();
	    this.xian3 = new ZhaPoker();
	    this.xian4 = new ZhaPoker();

	    this.zhuang_name = '未设置';
	    this.innings = 0;
	    this.zhuang_uid = 0;
	    this.robot_uid = 0;
	    this.zhuang_typ = 0;
	    this.zhuang_user_info = {};
	    this.robot_zhuang_venior = 0;
	    this.zhuang_queue = {};

	    this.online_rank_msg = [];
	    this.update_online_rank_zeit = 0;

	    this.robot_users = {};
	    this.robot_zhuang_users = [];
	},

});

module.exports = Table;