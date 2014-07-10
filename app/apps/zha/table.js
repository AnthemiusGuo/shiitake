var TablePublic = require('app/base/tablePublic');
var ZhaPoker = require('app/apps/zha/zhaPoker');
var Table = TablePublic.extend({
	init : function(tableId,roomConfig) {
		this._super(tableId,roomConfig);
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

	    this.canBet = false;
	},
	doStart : function(){
		this.canBet = false;
		this.zhuang.reset();
		this.xian1.reset();
		this.xian2.reset();
		this.xian3.reset();
		this.xian4.reset();

		this.bet_info = [0,0,0,0];
		this.user_bet_info = {};
	    this.user_bet_total = 0;

		//没啥要做，给用户广播下
		this.doBroadcast("table","Start",1,0,{cd:this.stateConfig[this.state].timer});
	},
	doWaitBet : function(){
		//没啥要做，给用户广播下
		this.canBet = true;
		this.doBroadcast("table","WaitBet",1,0,{cd:this.stateConfig[this.state].timer});
	},
	doWaitOpen : function(){
		//没啥要做，给用户广播下
		//用于安全周期而已
		this.canBet = false;
		this.doBroadcast("table","WaitOpen",1,0,{cd:this.stateConfig[this.state].timer});
	},
	doOpen : function(){
		//开

		this.canBet = false;

	},
	onOpenFinish : function(){
		//开

		this.doBroadcast("table","AfterOpen",1,0,{cd:this.stateConfig[this.state].timer});
	},
	onBet : function(uid,men,point){

		var userSession = this.userList[uid];
		if (userSession.credits < point) {
			//sssss
			return;
		}

		if (userSession.matchId_has_bet != this.matchId){
			userSession.reset();
	        userSession.matchId_has_bet = this.matchId;
	    }

		userSession.credits -= point;

		//men 参数是1，2，3，4
		
	    if (false) {//Math.floor(this.user_bet_total+point)>Math.floor(this.zhuang_user_info.credits/10)) {
	    	//停止压注
	        //code
	        //this.client.send({event:global.EVENT_CODE.ZHA_ADD_POINT,
	        //                 ret:-1});
	        return
	    }
		userSession.bet_info[men-1] +=point;
		this.bet_info[men-1] +=point;
		this.user_bet_total += point;
		if (!F.isset(this.user_bet_info[uid])) {
			this.user_bet_info[uid] = {};
			this.user_bet_info[uid][men] = point;
		} else {
			if (!F.isset(this.user_bet_info[uid][men])) {
				this.user_bet_info[uid][men] = point;
			} else {
				this.user_bet_info[uid][men] += point;
			}
		}
		
		// this.client.send({event:global.EVENT_CODE.ZHA_ADD_POINT,
	 //                     ret:0,
		// 					total_bet_info:this.client.logic_server.bet_info,
		// 					my_bet_info:this.bet_info});

	}

});

module.exports = Table;