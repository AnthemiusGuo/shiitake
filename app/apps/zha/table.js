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
	    this.zhuang_typ = 0;
	    this.zhuang_user_info = {};
	    this.zhuang_queue = {};

	    this.online_rank_msg = [];
	    this.update_online_rank_zeit = 0;

	    this.robot_users = {};
	    this.robot_zhuang_users = [];

	    this.canBet = false;
	    this.thisRoundFull = false;
	    this.thisRoundLimit = 0;

	    this.bet_info_change = false;

	    this.userZhuang = roomConfig.userZhuang;
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
		this.betTick = setInterval(this.onTickWaitBet.bind(this),1000);
	},
	onTickWaitBet : function() {
		if (this.bet_info_change) {
			this.doBroadcast("table","InBetNot",1,0,{total_bet_info:this.bet_info});
			this.bet_info_change = false;
		}
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
	    logger.debug("this.user_bet_info:",this.user_bet_info);

	    //不管用户在线不,先计算输赢
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

		var zhuang_result_send = {};
		zhuang_result_send['c'] = zhuang_credits;
		zhuang_result_send['get_exp'] = zhuang_exp;
		zhuang_result_send['cc'] = zhuang_result;


		if (this.zhuang_uid!=0){
			var this_user = null;
			//不是系统坐庄,写回数据
			if (F.isset(this.userList[this.zhuang_uid].userInfo)  && this.userList[this.zhuang_uid].isConnect) {
				this_user = this.userList[this.zhuang_uid];
	    		//已经有用户信息
	    		if (this_user.is_robot!=1) {
		            player_win_credts += credits;
		        }

	            this_user.userInfo['exp'] += zhuang_exp;
	            this_user.userInfo['credits'] += zhuang_credits;
	            this_user.userInfo['total_credits'] += zhuang_credits;
	            zhuang_result_send['r'] = this_user.userInfo['credits'];
				//通知用户				
				this.userList[this.zhuang_uid].send("table","OpenNot",1,0,{zhuang_me:zhuang_result_send,r:openResult,cd:this.stateConfig[this.state].timer});
	    	}
	    	//用户加经验,钱
    		//写回用户信息
			dmManager.setDataChange("user","BaseInfo",{uid:this.zhuang_uid},{'credits':zhuang_credits,'exp':zhuang_exp,total_credits:zhuang_credits},function(ret,data){
				if (ret>0) {
					//同步一下从userinfo拿出来的数据
					if (this_user!=null) {
						this_user.onGetUserInfo();
					}
					
				} else {
				}
			});
		}

	    //根据输赢,再去发数据
	    for (var uid in user_get){
	    	var credits = user_get[uid];
	    	var this_user = null;
	    	if (!F.isset(this.userList[uid])) {
	    		//用户未登录,这个应该是错误的状态,不应该出现
	    		//防止出错,直接发数据库请求
	    		var ClientUser = require('app/apps/'+appTyp+'/client');
	    		this_user = new ClientUser(null);
	    		this_user.isConnect = false;
				this_user.isLogined = false;
				this_user.uid = uid;
				this.userList[uid] = this_user;
	    	} else {
	    		this_user = this.userList[uid];
	    	}
	    	if (credits>0){
	            var real_credits = Math.round(credits*(1-room_water_ratio));
	            var exp = (credits - real_credits);
	            
	        } else {
	        	var real_credits = credits;
	        	var exp = 0;
	        }

	    	if (F.isset(this.userList[uid].userInfo) && this.userList[uid].isConnect) {
	    		//已经有用户信息
	    		if (this_user.is_robot!=1) {
		            player_win_credts += credits;
		        }

	            this_user.userInfo['exp'] += exp;
	            this_user.userInfo['credits'] += real_credits;
	            this_user.userInfo['total_credits'] += real_credits;
	            
				//用户升级改为异步通知,不再在这里通知
				//user_result[uid]['level'] = this_user.userInfo['level'];
				
				//通知用户				
				var me_result_send = {};
				me_result_send['c'] = real_credits;
				me_result_send['get_exp'] = exp;
				me_result_send['cc'] = user_result[uid]['cc'];
				me_result_send['r'] = this_user.userInfo['credits'];
				this.userList[uid].send("table","OpenNot",1,0,{zhuang:zhuang_result_send,me:me_result_send,r:openResult,cd:this.stateConfig[this.state].timer});
	    	}
	    	//用户加经验,钱
    		//写回用户信息
			dmManager.setDataChange("user","BaseInfo",{uid:uid},{'credits':real_credits,'exp':exp,total_credits:real_credits},function(ret,data){
				if (ret>0) {
					//同步一下从userinfo拿出来的数据
					if (this_user!=null) {
						this_user.onGetUserInfo();
					}
					
				} else {
				}
			});
	    }
	    //未下注的人的广播
	    for (var uid in this.userList){
	    	if (F.isset(user_get[uid])) {
	    		continue;
	    	}
	    	this.userList[uid].send("table","OpenNot",1,0,{zhuang:zhuang_result_send,r:openResult,cd:this.stateConfig[this.state].timer});
	    }
	    
	    this.zhuang_result_send = zhuang_result_send;
	    this.openResult = openResult;
	    if(this.zhuang_uid!=0){
	        this_user = user_get_user_base(this.zhuang_uid);
	        if(this_user['is_robot']!=1){
	            player_win_credts += zhuang_get;
	        }
	    }
		
	    if(player_win_credts<0){
	        player_win_credts = 0 - player_win_credts;
	        logicApp.st_ser_change("sys_win",player_win_credts);
	    }else{
	        logicApp.st_ser_change("sys_lost",player_win_credts);
	    }
		
	    logger.debug(user_result);
	    //rpc 通知Lobby以下用户发生数据变化, 为了节约信令, 采用batch通知
	    //upsteam无需通知,只要改变缓存内的值,直接可以生效
	},
	onBet : function(uid,men,point,packetSerId){
		logger.info("onBet",uid,men,point);

		if (!F.isset(this.userList[uid])){
			//no this user
			logger.error("no user for this uid:"+uid);
			return;
		}
		var userSession = this.userList[uid];
		if (this.canBet==false) {
			logger.error("this.canBet");
			userSession.sendAckErr("table","betAck",-100,"当前牌桌不是下注阶段哦",packetSerId);
			return;
		}

		if (this.thisRoundFull) {
			logger.error("this.thisRoundFull");
			userSession.sendAckErr("table","betAck",-101,"这一轮全桌压注总额已经满了哦,等下一轮吧",packetSerId);
			return;
		}

		logger.debug("userSession.credits",userSession.credits);
		if (userSession.credits < point*10) {
			logger.error("userSession.credits < point",userSession.credits,point);
			userSession.sendAckErr("table","betAck",-102,"您需要保持您手头的钱数大于下注额的十倍哦",packetSerId);
			return;
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
		    	userSession.sendAckErr("table","betAck",-101,"这一轮全桌压注总额已经满了哦,等下一轮吧",packetSerId);
		        return
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
		userSession.send("table","betAck",1,packetSerId,{total_bet_info:this.bet_info,my_bet_info:userSession.bet_info});
	},
	onJoinTable : function(userSession) {
		logger.debug("user "+userSession.uid+" join the table");
		this.userList[userSession.uid] = userSession;
		this.userCounter = Object.keys(this.userList).length;

		if (this.state=="init") {
			//第一个进桌的驱动这个桌子开始跑循环
			this.begin();
		}
		//game","m":"joinTable","d":{"prefer":0},"t":1404574299209,"s":1,"r":1}
		var allUsersInfo = {};
		for (var k in this.userList) {
			allUsersInfo[this.userList[k].uid] = this.userList[k].getUserShowInfo();
		}
		userSession.send("game","joinTableAck",1,0,{tableId:this.tableId,usersIn:allUsersInfo,userZhuang:this.userZhuang});
		this.doOptBroadcast("table","joinNot",1,0,userSession.getUserShowInfo());
		var now = new Date().getTime();
		if (this.state !="AfterOpen") {
			var cd = Math.ceil((now -  this.stateTime)/1000);
			userSession.send("table",this.state+"Not",1,0,{cd:this.stateConfig[this.state].timer-cd});
		} else {
			var cd = Math.ceil((now -  this.stateTime)/1000);
			userSession.send("table","OpenNot",1,0,{zhuang:this.zhuang_result_send,r:this.openResult,cd:this.stateConfig[this.state].timer-cd});
		}
	},
});

module.exports = Table;