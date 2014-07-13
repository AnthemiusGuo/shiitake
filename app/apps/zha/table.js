var TablePublic = require('app/base/tablePublic');
var ZhaPoker = require('app/apps/zha/zhaPoker');
var PokerUtils = require('app/base/pokerUtils');
//豹子>同花顺>金花>顺子>对子>散牌
//6 豹子> 5 同花顺> 4金花> 3顺子> 2对子> 1散牌
//对子	对应“门”下注额的2倍
    //顺子	对应“门”下注额的3倍
    //金花	对应“门”下注额的4倍
    //顺金	对应“门”下注额的6倍
    //豹子	对应“门”下注额的10倍
    //0 没用
var config_paixing_names = {
	"sanpai":1,
	"duizi":2,
	"shunzi":3,
	"jinhua":4,
	"tonghuashun":5,
	"baozi":6
};
var config_zha_ratio = [1,1,2,3,4,6,10];

var Table = TablePublic.extend({
	init : function(tableId,roomConfig) {
		this._super(tableId,roomConfig);

		//this.roomConfig内容包括
		// "roomId":11,
		// 		'room_name' :'初级场',
		// 	    'room_limit_low' :1000,
		// 	    'room_limit_kick' :1000,
		// 	    'room_limit_high' :2000000,
		// 	    "tableIdBegin":1,"tableIdEnd":99,
		// 	    "maxUserPerTable":100,
		// 		'room_zhuang_limit_low' :100000,
		// 	    'room_zhuang_limit_high' :43990000,
		// 	    'ratio' :0.0783,
		// 	    'room_desc' :'1千',
		// 		'order':1

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

	    this.zhuang = new ZhaPoker(0);
	    this.xian1 = new ZhaPoker(1);
	    this.xian2 = new ZhaPoker(2);
	    this.xian3 = new ZhaPoker(3);
	    this.xian4 = new ZhaPoker(4);

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
	    this.thisRoundFull = false;
	    this.thisRoundLimit = 0;
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
		this.doBroadcast("table","StartNot",1,0,{cd:this.stateConfig[this.state].timer});
	},
	doWaitBet : function(){
		//没啥要做，给用户广播下
		this.canBet = true;
		this.doBroadcast("table","WaitBetNot",1,0,{cd:this.stateConfig[this.state].timer});
	},
	doWaitOpen : function(){
		//没啥要做，给用户广播下
		//用于安全周期而已
		this.canBet = false;
		this.doBroadcast("table","WaitOpenNot",1,0,{cd:this.stateConfig[this.state].timer});
	},
	_getIsOpenBig: function(isZhuang) {
		if (isZhuang) {
			var pos = 0;
		} else {
			var pos = 1;
		}
		var openBig = this.roomConfig.openBig;
		// 'openBig':{
					//概率基准为10000, 填值为万分之几,不填的表示全随机,
					//例如填"baozi":[100,105],表示庄家1/100出豹子,闲家105/10000 出豹子,99%走普通随机,普通随机中当然也还有豹子的概率
				// 	"baozi":[110,100],
				// 	"tonghuashun":[1100.1000]
				// }

		var openBig2 = {};
		var plus = 0;
		for (var typ in openBig) {
			var opportunity = openBig[typ][pos];
			plus += opportunity;
			openBig2[typ]=plus;
		}
		seed = F.rand(0,10000);
		var bingo = "";
		for (var typ in openBig2) {
			var opportunity = openBig2[typ];
			if (seed<=opportunity) {
				bingo = typ;
				break;
			}
		}
		return bingo;
	},
	//ret 1 前者负，0 前者胜
	_get_win_loose : function(a,b){
		if (a.poker_typ.typ>b.poker_typ.typ){
			return 0;
		}
		if (a.poker_typ.typ<b.poker_typ.typ){
			return 1;
		}
		for (var i = 2; i >= 0; i--) {
			if (a.poker_typ.dianshu[i]>b.poker_typ.dianshu[i]) {
				return 0;
			} else if (a.poker_typ.dianshu[i]<b.poker_typ.dianshu[i]) {
				return 1;
			}
		};
		return 0;
	},
	doOpen : function(){
		//开
		var target_card = [];
		this.target_card = {};
		for (var i = 0; i < 52; i++) {
			target_card.push(i);
		};
		//初始化一个已经打乱的牌
		target_card = F.shuffle(target_card);
		for (var i = 0; i < 52; i++) {
			this.target_card["i"+target_card[i]]=1;
		};
		this.canBet = false;
		
		var tempPai = {};
		for (var i = 0;i<=4;i++) {
			//0 庄
			//1-4 其他
			if (i==0) {
				var isZhuang = true;
			} else {
				var isZhuang = false;

			}
			var isOpenBig = this._getIsOpenBig(isZhuang);
			if (isOpenBig!="") {
				tempPai[i] = this._openCardsByOpenBig(isOpenBig);
			} else {
				tempPai[i] = this._openCardsByRealRandom();
			}
			
		}
		//tempPai 五家牌已经有了
		this.zhuang.setPokers(tempPai[0]);
	    this.xian1.setPokers(tempPai[1]);
	    this.xian2.setPokers(tempPai[2]);
	    this.xian3.setPokers(tempPai[3]);
	    this.xian4.setPokers(tempPai[4]);

	    this.xian1.result = this._get_win_loose(this.zhuang,this.xian1);
	    this.xian2.result = this._get_win_loose(this.zhuang,this.xian2);
	    this.xian3.result = this._get_win_loose(this.zhuang,this.xian3);
	    this.xian4.result = this._get_win_loose(this.zhuang,this.xian4);
		
		
	},
	_openCardsByOpenBig : function(typ) {
		if (typ=="sanpai"){
			//sanpai并不强制散排,代价太大
			return this._openCardsByRealRandom();			
		}
		if (typ=="duizi") {
			var limit = 5;
			for (var i = 0; i < limit; i++) {
				var targetDuiziPai = F.rand(0,12);
				var hua1 = F.rand(0,3);
				var pai1 = PokerUtils.getPoker54ByInfo({typ:hua1,value:targetDuiziPai});

				if (!F.isset(this.target_card["i"+pai1])) {
					continue;
				}
				var hua2 = F.rand(0,3);
				if (hua2==hua1) {
					hua2 = hua1+1;
					if (hua2>3){
						hua2=0;
					}
				}
				var pai2 = PokerUtils.getPoker54ByInfo({typ:hua2,value:targetDuiziPai});

				if (!F.isset(this.target_card["i"+pai2])) {
					continue;
				}
				var counter = 0;
				var pai3 = F.rand(0,52);
				if (!F.isset(this.target_card["i"+pai3])) {
					continue;
				}
				this.target_card["i"+pai1] = null;
				this.target_card["i"+pai2] = null;
				this.target_card["i"+pai3] = null;

				return [pai1,pai2,pai3];

			};
			//冲突太多,找不到
			return this._openCardsByRealRandom();	
			
		} else if (typ=="shunzi") {
			var limit = 5;
			for (var i = 0; i < limit; i++) {
				//12 is A, 12,0,1 A,2,3是特殊允许
				//强制去掉同花顺
				var targetDuiziPai1 = F.rand(1,12);
				var hua1 = F.rand(0,3);
				var pai1 = PokerUtils.getPoker54ByInfo({typ:hua1,value:targetDuiziPai1});

				if (!F.isset(this.target_card["i"+pai1])) {
					continue;
				}
				if (targetDuiziPai1==1) {
					var targetDuiziPai2 = 12;
				} else {
					var targetDuiziPai2 = targetDuiziPai1 - 1;
				}
				var hua2 = F.rand(0,3);
				var pai2 = PokerUtils.getPoker54ByInfo({typ:hua2,value:targetDuiziPai2});

				if (!F.isset(this.target_card["i"+pai2])) {
					continue;
				}
				if (targetDuiziPai1==1) {
					var targetDuiziPai3 = 0;
				} else {
					var targetDuiziPai3 = targetDuiziPai1 - 2;
				}
				var hua3 = F.rand(0,3);
				if (hua3==hua2 && hua3==hua1) {
					hua3 = F.rand(0,3);
				}
				if (hua3==hua2 && hua3==hua1) {
					continue;
				}
				var pai3 = PokerUtils.getPoker54ByInfo({typ:hua3,value:targetDuiziPai3});

				if (!F.isset(this.target_card["i"+pai3])) {
					continue;
				}
				this.target_card["i"+pai1] = null;
				this.target_card["i"+pai2] = null;
				this.target_card["i"+pai3] = null;
				return [pai1,pai2,pai3];

			};
			//冲突太多,找不到
			return this._openCardsByRealRandom();
		} else if (typ=="jinhua") {
			var limit = 5;
			for (var i = 0; i < limit; i++) {
				var hua = F.rand(0,3);

				var targetDuiziPai1 = F.rand(0,12);
				var pai1 = PokerUtils.getPoker54ByInfo({typ:hua,value:targetDuiziPai1});
				if (!F.isset(this.target_card["i"+pai1])) {
					continue;
				}
				var targetDuiziPai2 = F.rand(0,12);
				var pai2 = PokerUtils.getPoker54ByInfo({typ:hua,value:targetDuiziPai2});
				if (!F.isset(this.target_card["i"+pai2])) {
					continue;
				}

				var targetDuiziPai3 = F.rand(0,12);
				var pai3 = PokerUtils.getPoker54ByInfo({typ:hua,value:targetDuiziPai3});
				if (!F.isset(this.target_card["i"+pai3])) {
					continue;
				}
				this.target_card["i"+pai1] = null;
				this.target_card["i"+pai2] = null;
				this.target_card["i"+pai3] = null;
				return [pai1,pai2,pai3];
			}
			//冲突太多,找不到
			return this._openCardsByRealRandom();

		} else if (typ=="tonghuashun") {
			var limit = 5;
			for (var i = 0; i < limit; i++) {
				//12 is A, 12,0,1 A,2,3是特殊允许
				var targetDuiziPai1 = F.rand(1,12);
				var hua1 = F.rand(0,3);
				var pai1 = PokerUtils.getPoker54ByInfo({typ:hua1,value:targetDuiziPai1});

				if (!F.isset(this.target_card["i"+pai1])) {
					continue;
				}
				if (targetDuiziPai1==1) {
					var targetDuiziPai2 = 12;
				} else {
					var targetDuiziPai2 = targetDuiziPai1 - 1;
				}
				var pai2 = PokerUtils.getPoker54ByInfo({typ:hua1,value:targetDuiziPai2});

				if (!F.isset(this.target_card["i"+pai2])) {
					continue;
				}
				if (targetDuiziPai1==1) {
					var targetDuiziPai3 = 0;
				} else {
					var targetDuiziPai3 = targetDuiziPai1 - 2;
				}
				var pai3 = PokerUtils.getPoker54ByInfo({typ:hua1,value:targetDuiziPai3});

				if (!F.isset(this.target_card["i"+pai3])) {
					continue;
				}
				this.target_card["i"+pai1] = null;
				this.target_card["i"+pai2] = null;
				this.target_card["i"+pai3] = null;
				return [pai1,pai2,pai3];

			};
			//冲突太多,找不到
			return this._openCardsByRealRandom();

		} else if (typ=="baozi") {
			var limit = 5;
			for (var i = 0; i < limit; i++) {
				//
				var targetDuiziPai1 = F.rand(1,12);
				var huaNo = F.rand(0,3);
				var allHua = [0,1,2,3];
				allHua.splice(huaNo,1);

				var pai1 = PokerUtils.getPoker54ByInfo({typ:allHua[0],value:targetDuiziPai1});

				if (!F.isset(this.target_card["i"+pai1])) {
					continue;
				}
				var pai2 = PokerUtils.getPoker54ByInfo({typ:allHua[1],value:targetDuiziPai1});

				if (!F.isset(this.target_card["i"+pai2])) {
					continue;
				}
				var pai3 = PokerUtils.getPoker54ByInfo({typ:allHua[2],value:targetDuiziPai1});

				if (!F.isset(this.target_card["i"+pai3])) {
					continue;
				}
				this.target_card["i"+pai1] = null;
				this.target_card["i"+pai2] = null;
				this.target_card["i"+pai3] = null;
				return [pai1,pai2,pai3];

			};
			//冲突太多,找不到
			return this._openCardsByRealRandom();
		}
	},
	_openCardsByRealRandom: function(){
		logger.info("_openCardsByRealRandom");
		var tempPai = [];
		var counter = 0;
		for (var k in this.target_card) {
			if (this.target_card[k] == null){
				continue;
			}
			counter++;
			if (counter>3) {
				break;
			}
			var p = k.substr(1);
			tempPai.push(p);
			this.target_card[k] = null;
		}

		return tempPai;
	},
	doOpenAwards : function(open){
		//发奖

	    //抽水比例
	    var room_water_ratio = this.roomInfo.ratio;

	    var user_get = {};
	    var zhuang_get = 0;

	    var user_result = {};

	    var zhuang_result = [0,0,0,0];

	    var user_exp = {};
	    var zhuang_exp = 0;

	    for (var uid in this.user_bet_info){
	    	var bets = this.user_bet_info[uid];

	        if (!F.isset(user_get[uid])){
	            user_get[uid] = 0;
	        }
	        if (!F.isset(user_result[uid])){
	            user_result[uid] = {'cc':[0,0,0,0],'r':0,'c':0};
	        }
	        for (var men in bets) {
	        	var point = bets[men];

	            var result = open.result[men-1];
	            
	            if (result==0){
	                //庄家胜

	                var ratio = config_zha_ratio[open['paixing'][0]];
	                change_credits = Math.round(point*ratio);

	                user_result[uid]['cc'][men-1] = 0- change_credits;
	                user_get[uid] -= change_credits;

	                zhuang_result[men-1] += change_credits;
	                zhuang_get += change_credits;
	            } else {
	                //闲家胜
	                ratio = config_zha_ratio[open['paixing'][men]];
	                change_credits = round(point*ratio);
	                //change_credits = round(point*ratio*(1-room_water_ratio));
	                zhuang_get -= change_credits;
	                zhuang_result[men-1] -= change_credits;

	                user_result[uid]['cc'][men-1] = change_credits;
	                user_get[uid] += change_credits;
	            }
	        }
	    }
	    player_win_credts = 0;
	    for (var uid in user_get){
	    	var credits = user_get[uid];
			var this_user = user_get_user_base(uid);
	        //is_robot = this_user['is_robot'];
	        if (this_user['is_robot']!=1){
	            player_win_credts += credits;
	        }
	        if (credits>0){
	            real_credits = round(credits*(1-room_water_ratio));
	            user_add_exp(uid,(credits - real_credits));			
	            user_result[uid]['c'] = real_credits;
	            user_result[uid]['r'] = change_credits(uid,10,101,real_credits,log_id);
				this_user = user_get_user_base(uid);
				user_result[uid]['exp'] = this_user['exp'];
				user_result[uid]['level'] = this_user['level'];
	        } else {
	            user_result[uid]['c'] = credits;
	            user_result[uid]['r'] = change_credits(uid,11,102,credits,log_id);
				user_result[uid]['exp'] = this_user['exp'];
				user_result[uid]['level'] = this_user['level'];
	        }
	    }
	    
	    //写入庄家TODOzhuang_info
	    zhuang_uid = zhuang_info['uid'];
		
		if (zhuang_get>0){
			zhuang_credits = round(zhuang_get*(1-room_water_ratio));
			zhuang_exp = round(zhuang_get*room_water_ratio);

	        user_result[-1]['c'] = zhuang_credits;
			if(room_id==1){
				user_result[-1]['r'] = 0;
				user_result[-1]['exp'] = 0;
				user_result[-1]['level'] = 0;
			}else{
				user_result[-1]['r'] = change_credits(zhuang_uid,10,101,zhuang_credits,log_id);
				user_add_exp(zhuang_uid,zhuang_exp);
				this_user = user_get_user_base(zhuang_uid);
	            
				user_result[-1]['exp'] = this_user['exp'];
				user_result[-1]['level'] = this_user['level'];
			}
		} else {
			zhuang_credits = zhuang_get;
	        user_result[-1]['c'] = zhuang_credits;
			if(room_id==1){
				user_result[-1]['r'] = 0;
				user_result[-1]['exp'] = 0;
				user_result[-1]['level'] = 0;
			}else{
				user_result[-1]['r'] = change_credits(zhuang_uid,11,102,zhuang_credits,log_id);
				this_user = user_get_user_base(zhuang_uid);
				user_result[-1]['exp'] = this_user['exp'];
				user_result[-1]['level'] = this_user['level'];
			}
			
		}
	    if(room_id!=1){
	        this_user = user_get_user_base(zhuang_uid);
	        if(this_user['is_robot']!=1){
	            player_win_credts += zhuang_get;
	        }
	    }
		user_result[-1]['cc'] = zhuang_result;
	    if(player_win_credts<0){
	        player_win_credts = 0 - player_win_credts;
	        st_ser_change("sys_win",player_win_credts);
	    }else{
	        st_ser_change("sys_lost",player_win_credts);
	    }
		

	},
	onOpenFinish : function(){
		//开

		this.doBroadcast("table","AfterOpenNot",1,0,{cd:this.stateConfig[this.state].timer});
	},
	onBet : function(uid,men,point,packetSerId){
		logger.info("onBet",uid,men,point);

		if (this.thisRoundFull) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		var userSession = this.userList[uid];
		logger.debug("userSession.credits",userSession.credits);
		if (userSession.credits < point) {
			userSession.sendErrPackFormat(packetSerId);
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
		//category,method,ret,packetId,data
		userSession.send("table","betAck",1,packetSerId,{total_bet_info:this.bet_info,my_bet_info:userSession.bet_info});
		// this.client.send({event:global.EVENT_CODE.ZHA_ADD_POINT,
	 //                     ret:0,
		// 					total_bet_info:this.client.logic_server.bet_info,
		// 					my_bet_info:this.bet_info});

	}

});

module.exports = Table;