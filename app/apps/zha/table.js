var table = Class.extend({
	init : function(tableId,roomConfig) {
		this.tableId = tableId;
		this.roomConfig = roomConfig;
		this.state = "init";
		this.matchId = 0;
		this.stateConfig = {"Start":{nextState:"WaitBet",timer:1},
							"WaitBet":{nextState:"WaitBet",timer:20},
							"WaitOpen":{nextState:"WaitBet",timer:20},
							"AfterOpen":{nextState:"WaitBet",timer:20}};
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
	},
	begin : function() {
		self.state = "Start";
		this.mainTimer = setTimeout(this["onState"+this.stateConfig[self.state].nextState].bind(this),this.stateConfig[self.state].timer);
	},
	onStateWaitBet : function(){
		self.state = "WaitBet";
		this.mainTimer = setTimeout(this["onState"+this.stateConfig[self.state].nextState].bind(this),this.stateConfig[self.state].timer);
	},
	onStateWaitOpen : function(){
		self.state = "WaitOpen";
		this.mainTimer = setTimeout(this["onState"+this.stateConfig[self.state].nextState].bind(this),this.stateConfig[self.state].timer);
	},
	onStateAfterOpen : function(){
		self.state = "AfterOpen";
		this.mainTimer = setTimeout(this["onState"+this.stateConfig[self.state].nextState].bind(this),this.stateConfig[self.state].timer);
	},
	onUserLogin : function(uid,user) {
		this.userList[uid] = user;
		this.userCounter = Object.keys(this.userList).length;
	}
});

module.exports = table;