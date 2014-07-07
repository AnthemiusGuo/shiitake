var Table = require('app/apps/base/baseTable');
//公共压注型桌子
var TablePublic = Table.extend({
	init : function(tableId,roomConfig) {
		this._super(tableId,roomConfig);
		this.matchId = 0;
		this.stateConfig = {"Start":{nextState:"WaitBet",timer:1},
							"WaitBet":{nextState:"WaitOpen",timer:20},
							"WaitOpen":{nextState:"AfterOpen",timer:20},
							"AfterOpen":{nextState:"Start",timer:20}};
		this.robotList = {};
		
	},
	run : function() {
		
	},
	stop : function() {
		if (this.mainTimer!==undefined && this.mainTimer!==null) {
			// clearInterval(this.mainTimer);
			clearTimeout(this.mainTimer);
			this.mainTimer = null;
		}
		if (this.betTimer!==undefined && this.betTimer!==null) {
			clearTimeout(this.betTimer);
			this.betTimer = null;
		}
	},
	waitNextState : function() {
		var self = this;
		logger.debug("timer:",this.stateConfig[this.state].timer);

		this.mainTimer = setTimeout(
		        function(){
		        	logger.debug("timer triggerd",self.state,self.stateConfig[self.state].nextState);
		        	self["onState"+self.stateConfig[self.state].nextState]();
		        },this.stateConfig[this.state].timer*1000);
	},
	broadcastBet : function() {
		var self = this;
		//广播压注情况
		this.betTimer = setTimeout(
		        function() {
		        	self.broadcastBet();
		        },1000);
	},
	begin : function() {
		logger.info("begin table loop!!");
		this.onStateStart();
	},
	onStateStart : function(){
		this.state = "Start";
		this.waitNextState();
		logger.debug("onStateStart");

		//没啥要做，给用户广播下
		this.doBroadcast("table","Start",1,0,{});
	},
	onStateWaitBet : function(){
		this.state = "WaitBet";
		this.waitNextState();
		this.broadcastBet();
		logger.debug("onStateWaitBet");
		this.doBroadcast("table","WaitBet",1,0,{});
	},
	onStateWaitOpen : function(){
		if (this.betTimer!==undefined && this.betTimer!==null) {
			clearTimeout(this.betTimer);
			this.betTimer = null;
		}
		this.state = "WaitOpen";
		this.waitNextState();
		logger.debug("onStateWaitOpen");
		this.doBroadcast("table","WaitOpen",1,0,{});
	},
	onStateAfterOpen : function(){
		this.state = "AfterOpen";
		this.waitNextState();
		logger.debug("onStateAfterOpen");
		this.doBroadcast("table","AfterOpen",1,0,{});
	},
	onJoinTable : function(userSession) {
		this._super(userSession);
		if (this.state=="init") {
			//第一个进桌的驱动这个桌子开始跑循环
			this.begin();
		}
		//game","m":"joinTable","d":{"prefer":0},"t":1404574299209,"s":1,"r":1}
		var allUsersInfo = {};
		for (var k in this.userList) {
			allUsersInfo[this.userList[k].uid] = this.userList[k].getUserShowInfo();
		}
		userSession.send("game","joinTable",1,0,{tableId:this.tableId,usersIn:allUsersInfo});
		logger.debug(userSession);
		this.doOptBroadcast("table","join",1,0,userSession.getUserShowInfo());
	}
});

module.exports = TablePublic;