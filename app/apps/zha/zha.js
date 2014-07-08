var GameServer = require('app/apps/base/game');
var ZhaServer = GameServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.roomId = info.indexParam.roomId;
		this.tables = {};
		this.onlineUsers = {};
		var roomConfigs = require('app/config/zha');
		this.roomConfig = roomConfigs.servers[this.id];
		this.tableIdBegin = this.roomConfig.tableIdBegin;
		this.tableIdEnd = this.roomConfig.tableIdEnd;
		this.state = "init";
		this.tableId = this.tableIdBegin;

		this.maxUserPerTable = this.roomConfig.maxUserPerTable;
	},
	run : function() {
		//connect lobby
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
		logger.debug("createTable as "+tableId);
		var Table = require('app/apps/zha/table');
		this.tables[tableId] = new Table(tableId,this.roomConfig);
		this.tables[tableId].run();
		return tableId;
	},
	deleteTable : function(tableId) {
		this.tables[tableId].stop();
		this.tables[tableId] = null;
	},
	joinTable : function(tableId,userSession){
		this.onlineUsers[userSession.uid] = userSession;
		userSession.joinTable(this.tables[tableId]);
		this.tables[tableId].onJoinTable(userSession);
	}

});
module.exports = ZhaServer;