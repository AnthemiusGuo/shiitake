var GameServer = require('app/base/game');
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
	doLogin : function(uid,userSession,packetId) {
		if (F.isset(this.userSocketManager.idClientMapping[uid])) {
			this.userSocketManager.idClientMapping[uid].kickUser();
		}

		//获取用户信息
		dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
			if (ret>0) {
				this.userSocketManager.idClientMapping[uid] = userSession;
				userSession.isLogined = true;
				userSession.id = uid;
				userSession.uid = uid;
				userSession.userInfo = data;
				userSession.onGetUserInfo();
				userSession.send("user","loginAck",1,packetId,data)
			} else {
				userSession.send("user","loginAck",ret,packetId,{e:"登录失败"})
			}
		}.bind(this));
	},
	run : function() {
		this._super();
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