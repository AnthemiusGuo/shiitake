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
	    this.zhuang_user_info = {};
	    this.zhuang_queue = [];

	    this.online_rank_msg = [];
	    this.update_online_rank_zeit = 0;

	    this.canBet = false;
	    this.thisRoundFull = false;
	    this.thisRoundLimit = 0;

	    this.bet_info_change = false;

	    this.userZhuang = roomConfig.userZhuang;

	    this.roborCount = 0;
	    this.isRobotZhuang = 0;

	    this.userCounter = 0;
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

	    //doStart之前已经整理过用户, 该踢掉的踢掉了.
	    //检查是否下庄
	    var checkIfXiaZhuang = this.checkIfXiaZhuang();
	    if (checkIfXiaZhuang>0) {
	    	logger.info("xiazhuang: reason as ",checkIfXiaZhuang);
	    	this.doGetNextZhuang();
	    }

		//没啥要做，给用户广播下当前状态
		var zhuang_showInfo = {};

		if (this.zhuang_uid!=0){
			if (F.isset(logicApp.uidUserMapping[this.zhuang_uid])) {
				zhuang_showInfo = logicApp.uidUserMapping[this.zhuang_uid].getUserShowInfo();
			}
		}
		this.doBroadcast("table","StartNot",{cd:this.stateConfig[this.state].timer,zhuang_uid:this.zhuang_uid,zhuang_info:zhuang_showInfo});

		//機器人相關
		if (this.roborCount<10) {
			logger.info("this.roborCount :",this.roborCount);
			//少於10個就一次性要10個機器人，然後慢慢根據情況踢,臨時請求2個
			this.askRobotUser(2);
		}
		if (this.userZhuang && this.zhuang_uid==0){
			//沒人坐莊，要個2個機器人排隊等着當莊
			this.askRobotZhuang(1);
		}
		logicApp.analyser.add(this.tableId,{rounds:1});
	},
	doWaitBet : function(){
		//没啥要做，给用户广播下
		this.canBet = true;
		this.doBroadcast("table","WaitBetNot",{cd:this.stateConfig[this.state].timer});
		this.betTick = setInterval(this.onTickWaitBet.bind(this),1000);
	},
	onTickWaitBet : function() {
		if (this.bet_info_change) {
			this.doBroadcast("table","InBetNot",{total_bet_info:this.bet_info});
			this.bet_info_change = false;
		}
	},
	doWaitOpen : function(){
		//没啥要做，给用户广播下
		//用于安全周期而已
		this.canBet = false;
		this.doBroadcast("table","WaitOpenNot",{cd:this.stateConfig[this.state].timer});
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
		tempPai[0] = F.shuffle(tempPai[0]);
		tempPai[1] = F.shuffle(tempPai[1]);
		tempPai[2] = F.shuffle(tempPai[2]);
		tempPai[3] = F.shuffle(tempPai[3]);
		tempPai[4] = F.shuffle(tempPai[4]);
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
		
		logger.debug(this.zhuang);
	    logger.debug(this.xian1);
	    logger.debug(this.xian2);
	    logger.debug(this.xian3);
	    logger.debug(this.xian4);

	    this.his_1.shift();
	    this.his_2.shift();
	    this.his_3.shift();
	    this.his_4.shift();

	    this.his_1.push(this.xian1.result);
	    this.his_2.push(this.xian2.result);
	    this.his_3.push(this.xian3.result);
	    this.his_4.push(this.xian4.result);

	    //算钱

	    this.doOpenAwards();

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
		logger.debug("_openCardsByRealRandom");
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
	_rpcCallUserChangeBatch : function(){
		logger.info("_rpcCallUserChangeBatch",this.uidChanged);
		for (var k in this.uidChanged){
			if (this.uidChanged[k]==0) {
				//not write back yet, so don't call rpc
				return;
			}
		}
		var uids = F.array_keys(this.uidChanged);
		logger.info("_rpcCallUserChangeBatch",uids);
		//rpc 通知Lobby以下用户发生数据变化, 为了节约信令, 采用batch通知
	    //upsteam无需通知,只要改变缓存内的值,直接可以生效
	    //typ,category,method,id,params){
	    rpc.typBroadcastCall("lobby","user","batchReload",{uids:uids});

		this.uidChanged = {};
	},
	doOpenAwards : function(){
		//发奖
		var openResult = {};
		openResult[0] = this.zhuang.getPokers();
	    openResult[1] = this.xian1.getPokers();
	    openResult[2] = this.xian2.getPokers();
	    openResult[3] = this.xian3.getPokers();
	    openResult[4] = this.xian4.getPokers();
	    //抽水比例
	    var room_water_ratio = this.roomConfig.ratio;

	    var user_get = {};
	    var zhuang_get = 0;

	    var user_result = {"-1":{}};

	    var zhuang_result = [0,0,0,0];

	    var user_exp = {};
	    var zhuang_exp = 0;

	    this.uidChanged = {};
	    this.allUserChanges = {};
	    logger.debug("this.user_bet_info:",this.user_bet_info);

	    var analyser = {
	    	allUserBets : 0,
			sysWin : 0,
			water : 0,
			robotWin : 0,
			zhuangWin : 0
		};

	    //不管用户在线不,先计算输赢
	    for (var uid in this.user_bet_info){
	    	var bets = this.user_bet_info[uid];

	        if (!F.isset(user_get[uid])){
	            user_get[uid] = 0;
	        }
	        if (!F.isset(user_result[uid])){
	            user_result[uid] = {'cc':[0,0,0,0],'c':0,'get_exp':0};
	        }
	        for (var men in bets) {
	        	var point = bets[men];
	        	analyser.allUserBets += point;

	            var result = this['xian'+men].result;
	            
	            if (result==0){
	                //庄家胜

	                var ratio = config_zha_ratio[this.zhuang.poker_typ.typ];
	                change_credits = Math.round(point*ratio);

	                user_result[uid]['cc'][men-1] = 0- change_credits;
	                user_get[uid] -= change_credits;

	                zhuang_result[men-1] += change_credits;
	                zhuang_get += change_credits;
	            } else {
	                //闲家胜
	                ratio = config_zha_ratio[this['xian'+men].poker_typ.typ];
	                change_credits = Math.round(point*ratio);

	                //change_credits = round(point*ratio*(1-room_water_ratio));
	                zhuang_get -= change_credits;
	                zhuang_result[men-1] -= change_credits;

	                user_result[uid]['cc'][men-1] = change_credits;
	                user_get[uid] += change_credits;
	            }
	        }
	        this.uidChanged[uid]=0;
	        //收入要剪掉抽水
	        if (user_get[uid]>0){
	            var real_credits = Math.round(user_get[uid]*(1-room_water_ratio));
	            var exp = (user_get[uid] - real_credits);
	            
	        } else {
	        	var real_credits = user_get[uid];
	        	var exp = 0;
	        }
	        user_result[uid]['get_credits'] = real_credits;
			user_result[uid]['get_exp'] = exp;
	    }

	    //用户总收益, 用于统计分析
	    player_win_credts = 0;
	    
	    logger.debug(zhuang_get,user_get);
	    
	    //先处理庄,因为每个用户都要顺便把庄的信息广播掉

	    var zhuang_credits = zhuang_get;
	    var zhuang_exp = 0;

		if (zhuang_get>0) {
			zhuang_credits = Math.round(zhuang_get*(1-room_water_ratio));
			
			//系统坐庄不计经验
			if (this.zhuang_uid!=0) {
				zhuang_exp = Math.round(zhuang_get*room_water_ratio);
			}
		} 

		analyser.zhuangWin += zhuang_get;
		

		var zhuang_result_send = {};
		zhuang_result_send['get_credits'] = zhuang_credits;
		zhuang_result_send['get_exp'] = zhuang_exp;
		zhuang_result_send['cc'] = zhuang_result;

		if (this.zhuang_uid==0) {
			//系统坐庄，钱输赢都是系统的，统计系统输赢
			analyser.sysWin += zhuang_get;
		}

		if (this.zhuang_uid!=0){
			user_result[this.zhuang_uid] = zhuang_result_send;
		}

		//rpc 通知所有人開牌，
		
		this.doBroadcast("table","OpenNot",{zhuang:zhuang_result_send,r:openResult,cd:this.stateConfig[this.state].timer});
		//rpc 通知lobby寫回數據並開牌
		this.doRpcToMultiLobbies("user","batchUpdate",Object.keys(user_result),user_result);
	    
	    //统计分析，保存现场等
	    this.zhuang_result_send = zhuang_result_send;
	    this.openResult = openResult;

	    if(this.zhuang_uid!=0) {
	        var this_user = logicApp.uidUserMapping[this.zhuang_uid];
	        if (this_user.is_robot) {
	            player_win_credts += zhuang_get;
	        }
	    }
		logicApp.analyser.add(this.tableId,analyser);
	    		
	},
	onBet : function(uid,men,point){
		logger.info("onBet",uid,men,point);

		if (!F.isset(logicApp.uidUserMapping[uid])){
			//no this user
			logger.error("no user for this uid:"+uid);
			return;
		}
		var userSession = logicApp.uidUserMapping[uid];
		if (this.canBet==false) {
			logger.error("this.canBet");
			return [-100,{e:"当前牌桌不是下注阶段哦"}];
		}
		if (this.zhuang_uid==uid) {
			logger.error("is zhuang");
			return [-103,{e:"您是庄家,不能下注"}];
		}

		if (this.thisRoundFull) {
			logger.error("this.thisRoundFull");
			return [-101,{e:"这一轮全桌压注总额已经满了哦,等下一轮吧"}];
		}

		logger.debug("userSession.credits",userSession.credits);
		if (userSession.credits < point*10) {
			logger.error("userSession.credits < point",userSession.credits,point);
			return [-102,{e:"您需要保持您手头的钱数大于下注额的十倍哦"}];
		}

		if (userSession.matchId_has_bet != this.matchId){
			userSession.reset();
	        userSession.matchId_has_bet = this.matchId;
	    }

	    this.bet_info_change = true;

		userSession.credits -= point*10;

		//men 参数是1，2，3，4
		if (this.zhuang_uid>0) {
			if (Math.floor(this.user_bet_total+point)>Math.floor(this.zhuang_user_info.credits/10)) {
		    	//停止压注
		    	this.thisRoundFull = true;
		    	return [-101,{e:"这一轮全桌压注总额已经满了哦,等下一轮吧"}];
		    }
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
		return [1,{total_bet_info:this.bet_info,my_bet_info:userSession.bet_info}];
	},
	onJoinTable : function(user) {
		logger.debug("user "+user.uid+" join the table");


		// 'room_limit_low' :1000,
		// 	    'room_limit_kick' :1000,
		// 	    'room_limit_high' :2000000,
		// 	    "maxUserPerTable":100,
		// 		'room_zhuang_limit_low' :100000,
		// 	    'room_zhuang_limit_high' :43990000,

		if (false) { //user.userInfo.credits < this.roomConfig.room_limit_low) {
			return [-101,{e:'您的游戏币不足',room_limit_low:this.roomConfig.room_limit_low}];
		}
		if (false) { //user.userInfo.credits > this.roomConfig.room_limit_high) {
			return [-102,{e:'您的游戏币过高',room_limit_high:this.roomConfig.room_limit_high}];			
		}

		this.doOptBroadcast("table","joinNot",{uid:uid,userInfo:user.getUserShowInfo()});

		var uid = user.uid;
		this.userList[uid] = 1;

		this.userCounter = Object.keys(this.userList).length;

		if (this.state=="init" && !user.is_robot) {
			//第一个进桌的驱动这个桌子开始跑循环
			this.begin();
		}
		//game","m":"joinTable","d":{"prefer":0},"t":1404574299209,"s":1,"r":1}
		var allUsersInfo = {};
		for (var k in this.userList) {
			if (this.userList[k]==null) {
				continue;
			}
			allUsersInfo[k] = logicApp.uidUserMapping[k].getUserShowInfo();
		}
		
		var now = new Date().getTime();
		var tableStatus = {};
		var cd = Math.ceil((now -  this.stateTime)/1000);
		tableStatus = {state:this.state,cd:this.stateConfig[this.state].timer-cd};

		if (this.state =="AfterOpen") {
			tableStatus.zhuang = this.zhuang_result_send;
			tableStatus.r  = this.openResult;
		}

		if (user.is_robot) {
			this.roborCount++;
		}
		user.tableId = this.tableId;
		return [1,{tableId:this.tableId,usersIn:allUsersInfo,userZhuang:this.userZhuang,tableStatus:tableStatus}];
	},
	onAskZhuang : function(uid,data) {
		var now = new Date().getTime();
		if (!F.isset(logicApp.uidUserMapping[uid])){
			//no this user
			logger.error("no user for this uid:"+uid);
			return;
		}
		var userSession = logicApp.uidUserMapping[uid];
		if (!this.userZhuang) {
			//不允许用户当庄
			return [-100,{e:'这个房间不允许用户坐庄'}];		
		}
		for (var i = 0; i < this.zhuang_queue.length; i++) {
			if (this.zhuang_queue[i].uid==uid){
				return [-101,{e:'您已经报名成功'}];
			}
		};
		var credits = userSession.userInfo.credits;
		if (this.roomConfig.room_zhuang_limit_low>0 && credits < this.roomConfig.room_zhuang_limit_low) {
			return [-102,{e:'您的游戏币不足',room_zhuang_limit_low:this.roomConfig.room_zhuang_limit_low}];		
		}
		if (this.roomConfig.room_zhuang_limit_high>0 && credits > this.roomConfig.room_zhuang_limit_high) {
			return [-103,{e:'您的游戏币过高',room_zhuang_limit_high:this.roomConfig.room_zhuang_limit_high}];	
		}

		this.zhuang_queue.push({time:now,uid:uid});
		return [1,{}];	
	},
	arrange_user_list: function(){
		//清理内存
		
		for (var k in this.userList) {
			if (this.userList[k]==null) {
				continue;
			}
			if (!F.isset(logicApp.uidUserMapping[k])) {
				continue;
			}
			if (k == this.zhuang_uid) {
				//庄下线继续当庄
				continue;
			}
			if (!logicApp.uidUserMapping[k].isConnect) {
				if (logicApp.uidUserMapping[k].is_robot) {
					this.roborCount--;
				}
				logicApp.uidUserMapping[k].closeSocket();
				logicApp.uidUserMapping[k] = null;
			}
		}
		for (var i = 0; i < this.zhuang_queue.length; i++) {
			if (!F.isset(this.zhuang_queue[i])) {
				continue;
			}
			var info = this.zhuang_queue[i];
			if (!F.isset(logicApp.uidUserMapping[info.uid])) {
				this.zhuang_queue[i] = null;
			}
		};
		logicApp.uidUserMapping = utils.clearUpHash(logicApp.uidUserMapping);
		this.zhuang_queue = utils.clearUpArray(this.zhuang_queue);
	},
	checkIfXiaZhuang : function() {
		if (!this.userZhuang){
			return 0;//初级场系统坐庄，不下庄
		}
		if (this.zhuang_uid==0) {
			//木有人上庄
			return 3;
		}
		
		this_user = logicApp.uidUserMapping[this.zhuang_uid];

		//机器人坐庄
		if (this_user.is_robot) {
			//检查有玩家报名庄不
            return 2;
        }
        if (this.roomConfig.max_zhuang_round > 0) {
        	if (F.isset(this.zhuang_user_info.counter)) {
	        	this.zhuang_user_info.counter++;
	        } else {
	        	this.zhuang_user_info.counter = 1;
	        }
        }

		if (this.roomConfig.max_zhuang_round > 0 && this.zhuang_user_info.counter >= this.roomConfig.max_zhuang_round){
			return 1;
		}
		
		
		if (this_user.credits<this.roomConfig.room_zhuang_limit_low){
			return 2;
		}
		return 0;
	},
	doGetNextZhuang : function() {
		if (this.zhuang_queue.length>0) {
			var thisQueue = this.zhuang_queue.shift();
			logger.info("get new queue zhuang uid as",thisQueue);
			if (!F.isset(logicApp.uidUserMapping[thisQueue.uid]) || logicApp.uidUserMapping[thisQueue.uid].isConnect==false) {
				this.doGetNextZhuang();
				return;
			}
			var this_user = logicApp.uidUserMapping[thisQueue.uid];
			if (this_user.userInfo.credits < this.roomConfig.room_zhuang_limit_low){
				//钱不够,跳过
				this.doGetNextZhuang();
				return;
			}
			//这个人可以!
			this.doChangeZhuang(thisQueue.uid);
		}
		else 
		{
			if (this.userZhuang) {
				this.doChangeZhuang(0);
				logger.error('no one here for queue');
			}
		}
	},
	doChangeZhuang : function(uid) {
		logger.info("change zhuang!!!!= uid as",uid);
		this.zhuang_uid = uid;
		if (F.isset(logicApp.uidUserMapping[uid]) && uid!=0){
			this.zhuang_user_info = logicApp.uidUserMapping[uid].userInfo;
			this.zhuang_user_info.counter = 0;
		} else {
			this.zhuang_user_info = {counter:0};
		}
	},
	askRobotUser: function(count) {
		rpc.call("robot","user","join",{forTyp:"zha"},{count:count,tableId:this.tableId,serverId:logicApp.id,ticket:logicApp.globalTicket});
	},
	askRobotZhuang : function(count) {
		rpc.call("robot","user","joinAndAskZhuang",{forTyp:"zha"},{count:count,tableId:this.tableId,serverId:logicApp.id,ticket:logicApp.globalTicket});
	}
});

module.exports = Table;