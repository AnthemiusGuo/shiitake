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
	},
	run : function() {
		//connect lobby
		rpc.run("lobby","serverLogin",{typ:this.typ},{id:this.id,typ:this.typ});

		//init 1 table at least
		this.createTable();
		// for (var i = this.tableIdBegin; i <= this.tableIdEnd; i++) {
		// 	this.createTable();
		// };
		
	},

	createTable : function() {
		console.log("createTable for "+this.typ);
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
		console.log("createTable as "+tableId);
		var Table = require('app/apps/zha/table');
		this.tables[tableId] = new Table(tableId,this.roomConfig);
		this.tables[tableId].run();
	},
	deleteTable : function(tableId) {
		this.tables[tableId].stop();
		this.tables[tableId] = null;
	}
});
module.exports = ZhaServer;