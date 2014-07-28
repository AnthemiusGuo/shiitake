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
	doLogin : function(data,userSession,packetId) {
		var uid = data.uid;
		var ticket = data.ticket;
		if (F.isset(this.userSocketManager.idClientMapping[uid])) {
			this.userSocketManager.idClientMapping[uid].kickUser();
		}

		async.waterfall([
            function verifyTicket(callback) {
                logger.debug("verifyTicket");
                var real_key = "user/ticket/"+uid;
                kvdb.get(real_key,function(err, reply) {
                    logger.debug("verifyTicket result",reply);
                    if (err) {
                        callback(-2,err);
                        return;
                    }
                    if (reply===null) {
                        callback(-1,"don't hit cache");
                        return;
                    }
                    //hit cache!!!
                    if (reply!=ticket){
                    	callback(-3,"ticket Error!");
                    	return;
                    }
                    callback(null);
                });
            },
            function getInfo(callback){
                logger.debug("getInfo");
                dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
                    logger.debug("getInfo result",ret);
                    if (ret>0) {
                    	callback(null, data);
                    } else {
                    	callback(-4,"no user info");
                    }
                });
            },
            function sendBack(data, callback){
                this.userSocketManager.idClientMapping[uid] = userSession;
				userSession.isLogined = true;
				userSession.id = uid;
				userSession.uid = uid;
				userSession.userInfo = data;
				userSession.onGetUserInfo();
				userSession.send("user","loginAck",1,packetId,{})
				//无需再callback了
                // callback(null, 'done');
            }.bind(this)
        ], function doneAll (err, result) {
            if (err) {
                logger.error("doneAll with err",err,result);
                userSession.send("user","loginAck",err,packetId,{e:"登录失败"})
            }
            
        });	
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