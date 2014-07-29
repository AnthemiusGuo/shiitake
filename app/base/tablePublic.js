var Table = require('app/base/baseTable');
//公共压注型桌子
var TablePublic = Table.extend({
	init : function(tableId,roomConfig) {
		this.tableId = tableId;
		this.roomConfig = roomConfig;
		this.state = "init";
		this.userList = {};
		this.userCounter = 0;
		this.worldChatQueue = [];
		this.worldChatLastSend = 0;
		
		this.matchId = 0;
		this.stateConfig = {"Start":{nextState:"WaitBet",timer:1},
							"WaitBet":{nextState:"WaitOpen",timer:20},
							"WaitOpen":{nextState:"AfterOpen",timer:2},
							"AfterOpen":{nextState:"Start",timer:20}};
		this.robotList = {};
		this.stateTime = 0;
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
		logger.trace("timer:",this.stateConfig[this.state].timer);
		this.stateTime = new Date().getTime();
		this.mainTimer = setTimeout(
		        function(){
		        	logger.trace("timer triggerd",self.state,self.stateConfig[self.state].nextState);
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
	pause : function() {
		logger.info("pause table loop!!");
		this.state = "init";
		clearTimeout(this.mainTimer);
	},
	onStateStart : function(){
		this.matchId = new Date().getTime();
		this.state = "Start";
		this.waitNextState();
		logger.trace("onStateStart");

		this.arrange_user_list();
		this.doStart();
	},

	onStateWaitBet : function(){
		this.state = "WaitBet";
		this.waitNextState();
		this.broadcastBet();
		logger.trace("onStateWaitBet");
		this.doWaitBet();
	},
	onStateWaitOpen : function(){
		if (this.betTimer!==undefined && this.betTimer!==null) {
			clearTimeout(this.betTimer);
			this.betTimer = null;
		}
		this.state = "WaitOpen";
		this.waitNextState();
		logger.trace("onStateWaitOpen");
		this.doWaitOpen();
	},
	onStateAfterOpen : function(){
		this.state = "AfterOpen";
		this.waitNextState();
		logger.trace("onStateAfterOpen");
		this.doOpen();
	},
	doStart : function(){
		utils.PLEASE_OVERWRITE_ME();
	},
	doWaitBet : function(){
		utils.PLEASE_OVERWRITE_ME();
	},
	doWaitOpen : function(){
		utils.PLEASE_OVERWRITE_ME();
	},
	doOpen : function(){
		utils.PLEASE_OVERWRITE_ME();
	},

	onJoinTable : function(userSession) {
		utils.PLEASE_OVERWRITE_ME();		
	},
	
});

module.exports = TablePublic;