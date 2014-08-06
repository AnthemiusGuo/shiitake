var GameServer = require('app/base/game');
var ZhaServer = GameServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.GAME_ID = 1;
		this.roomId = info.roomId;
		this.tables = {};
		var roomConfigs = require('app/config/zha');
		this.tableConfig = roomConfigs.servers[this.id];
		this.roomConfig = roomConfigs.rooms["zha-room-"+this.tableConfig.roomId];

		//table 开牌覆盖room
		if (F.isset(this.tableConfig.openBig)){
			this.roomConfig.openBig = this.tableConfig.openBig;
		}

		this.tableIdBegin = this.tableConfig.tableIdBegin;
		this.tableIdEnd = this.tableConfig.tableIdEnd;
		this.maxUserPerTable = this.tableConfig.maxUserPerTable;

		this.state = "init";
		this.tableId = this.tableIdBegin;

		

		var Analyser =  require('app/apps/zha/analyser');
		this.analyser = new Analyser();
		this.tableCounter = 0;

		global.User = require('app/apps/zha/user');

	},
	genLoadBalance : function() {
		return this.tableCounter;
	},
	prepare : function() {
		//nothing to do 
	},
	onAllReady: function() {
		this._super();
		//init 1 table at least
		this.createTable();
		// for (var i = this.tableIdBegin; i <= this.tableIdEnd; i++) {
		// 	this.createTable();
		// };
		
	},
	
	findTable : function(preferTableId){
		if (preferTableId!=0) {
			if (F.isset(this.tables[preferTableId])) {
				return preferTableId;
			}
		}

		for (var k in this.tables) {
			if (this.tables[k].userCounter<this.maxUserPerTable) {
				return k;
			}
		}
		return this.createTable();

	},

	createTable : function() {
		logger.info("createTable for "+this.typ);
		var tableId = 0;
		for (var i = this.tableIdBegin; i <= this.tableIdEnd; i++) {
			if (this.tables[i]===undefined || this.tables[i]===null) {
				tableId = i;
				break;
			}
		};
		if (tableId==0) {
			this.setErr("No new table id left");
			
			return false;
		}
		logger.info("createTable as "+tableId);
		var Table = require('app/apps/zha/table');
		this.tables[tableId] = new Table(tableId,this.roomConfig);
		this.tables[tableId].run();
		this.analyser.initTable(tableId);
		this.tableCounter++;
		return tableId;
	},
	deleteTable : function(tableId) {
		this.tables[tableId].stop();
		this.tables[tableId] = null;
		this.tableCounter--;
	},
	doJoinTable : function(uid,tableId){
		if (!F.isset(this.uidUserMapping[uid])){
			return [-100,{e:'user not login to game'}];
		}
		var user = this.uidUserMapping[uid];
		return this.tables[tableId].onJoinTable(user);
	},
	doLeaveTable : function(uid,tableId){
		if (!F.isset(this.uidUserMapping[uid])){
			return [-100,{e:'user not login to game'}];
		}
		var user = this.uidUserMapping[uid];
		return this.tables[tableId].onLeaveTable(user);
	},
	checkCanEnterGame : function(data) {
		//用户钱够不
		// this.roomConfig
		return [1,""];
	},
	genEnterGameAck : function(uid) {
		//如果用户还在比赛当中，返回对应tableid
		//否则返回tableid 0
		//TODO
		return {tableId:0,roomId:this.roomId,gameId:this.GAME_ID};
	}

});
module.exports = ZhaServer;