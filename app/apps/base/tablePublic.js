//公共压注型桌子
var table = Class.extend({
	init : function(tableId,roomConfig) {
		this.tableId = tableId;
		this.roomConfig = roomConfig;
		this.state = "init";
		this.matchId = 0;
		this.stateConfig = {"Start":{nextState:"WaitBet",timer:1},
							"WaitBet":{nextState:"WaitOpen",timer:20},
							"WaitOpen":{nextState:"AfterOpen",timer:20},
							"AfterOpen":{nextState:"Start",timer:20}};
		this.userList = {};
		this.robotList = {};
		this.userCounter = 0;
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
		this.mainTimer = setTimeout(this["onState"+this.stateConfig[this.state].nextState].bind(this),this.stateConfig[this.state].timer);
	},
	broadcastBet : function() {
		this.betTimer = setTimeout(this.broadcastBet.bind(this),1000);
		//广播压注情况

	},
	begin : function() {
		this.state = "Start";
		this.waitNextState();
	},
	onStateWaitBet : function(){
		this.state = "WaitBet";
		this.waitNextState();
		this.broadcastBet();
	},
	onStateWaitOpen : function(){
		if (this.betTimer!==undefined && this.betTimer!==null) {
			clearTimeout(this.betTimer);
			this.betTimer = null;
		}
		this.state = "WaitOpen";
		this.waitNextState();
	},
	onStateAfterOpen : function(){
		this.state = "AfterOpen";
		this.waitNextState();
	},
	onUserLogin : function(uid,user) {
		this.userList[uid] = user;
		this.userCounter = Object.keys(this.userList).length;
	}
});

module.exports = table;