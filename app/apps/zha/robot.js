var BaseRobot = require('app/apps/robot/baseRobot');
var ZhaRobot = BaseRobot.extend({
	init : function(forTyp,uid) {
		this._super(forTyp,uid);
		//ai类型, 无倾向, 激进型, 保守型, 疯狂型, 作弊型
		this.aiTyps = ["null","agressive","possive","ganghu","cheater"];
		//作弊型机器人 告诉服务器我是作弊型的, 服务器开牌时候优先给cheater大牌
		this.onTableTyps = ["user","zhuang"];
		this.tableId = 0;
		this.onBet = false;
		this.betCounter = 0;

	},
	
	_changeCanUseChip : function(){
		var credits = this.userInfo.credits;
		this.totalBetChip = Math.round(credits / 10);
		if (credits<=9999){
            this.canUseChip = [10,20,50];
        } else if (credits<=29999){
            this.canUseChip = [20,50,100];
        } else if (credits<=49999){
            this.canUseChip = [50,100,200];
        } else if (credits<=199999){
            this.canUseChip = [100,200,500];
        } else if (credits<=499999){
            this.canUseChip = [500,1000,2000];
        } else if (credits<=999999){
            this.canUseChip = [1000,2000,5000];
        } else if (credits<=2999999){
            this.canUseChip = [2000,5000,10000];
        } else if (credits<=4999999){
            this.canUseChip = [5000,10000,20000];
        } else if (credits<=19999999){
            this.canUseChip = [10000,20000,50000];
        } else {
            this.canUseChip = [20000,50000,100000];
        }

	},
	onMsg : function(category,method,r,data){
		logger.info(category,method,data);
	},
	onMsg_game_enterGameAck : function(r,data){
		if (r>0) {
			this.betCounter = 0;
			this.call('game','joinTableReq',{prefer:this.tableId})
			logger.info("on Msg user login succ!!",data);
		} else {
			this.close();
			logger.info("on Msg user login fail!!",data,r);
		}
		
	},
	onMsg_game_joinTableAck : function(r,data){
		if (this.onTableTyp=="zhuang") {
			//莊的話，發個要求上莊排隊
			this.call('table','askZhuangReq',{})
		} else {
			//等着壓注信令

		}
		
		logger.info(data);
	},
	onMsg_table_StartNot : function(r,data){
		if (this.betCounter > F.rand(3,7)) {
			//离开
			logger.info("Robot will leave now!!! as ",this.uid);
			this.close();
		}
	},
	onMsg_table_WaitOpenNot : function(r,data){
		this.onBet = false;
	},
	onMsg_table_WaitBetNot : function(r,data){
		this.onBet = true;
		if (this.onTableTyp=="zhuang") {
			//莊的話，永遠不管
			return;
		} 
		this.doBet(data.cd);
		
		logger.info(data);
	},
	onMsg_table_OpenNot : function(r,data){
		if (!F.isset(data.me)){
			//和我这个机器人无关
			return;
		}
		this.userInfo.credits = data.me.r;

	},
	doBet : function(cd){
		this._changeCanUseChip();
		//押幾次，可以0次
		var betCount = F.rand(0,3);
		if (betCount==0) {
			return;
		}
		this.betCounter++;
		//進這一門押，否則數學期望押多門，總是輸的可能性大
		var men = F.rand(1,4);

		for (var i = 0; i < betCount; i++) {
			var chip_id = F.rand(0,2);
			var bet = this.canUseChip[chip_id];
			//錢夠麼
			this.totalBetChip -= bet;
			if (this.totalBetChip<0){
				continue;
			}

			setTimeout(function(){
				if (this.onBet==false) {
					return;
				}
				this.call('table','betReq',{men:men,point:bet});
			}.bind(this),F.rand(0,cd-2)*1000);
		};
	},
	connectAndJoin : function(thisServer,tableId){
		this.tableId = tableId;
		this.targetServerId = thisServer.id;

		this.call("game","enterGameReq",{lobbyId:logicApp.id,userInfo:this.getSendToGameInfo()});
	},

	close : function() {
		this.call("game","leaveGameReq",{uid:this.uid});
		this.targetServerId = "";
		this.connected = false;
		this.ready = false;
		logicApp.reUseRobot(this.uid);
	}
});
module.exports = ZhaRobot;