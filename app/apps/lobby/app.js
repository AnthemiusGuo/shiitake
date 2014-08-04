var BaseServer = require('framework/base/baseConnectorServer');
var LobbyServer = BaseServer.extend({
	
    prepare : function() {
        //for zha, 重新整理kv为基于room的
        this.gameServersZha = {};
        for (var k in config.servers.zha.serverList) {
            var v = config.servers.zha.serverList;
            this.gameServersZha[v.roomId].
        }
    },
    
    genLoadBalance : function() {
        return this.onlineUserCount;
    },
	doLogin : function(data,userSession,packetId) {
		//用户密码并非这里校验, 使用web校验, 所以这里需要校验web生成的ticket
		var uid = data.uid;
		var ticket = data.ticket;
        var game = data.game;

        var self = this;
		if (F.isset(this.userSocketManager.idClientMapping[uid])) {
			this.userSocketManager.idClientMapping[uid].kickUser();
		}
		this.onlineUsers[uid] = userSession;
        
		//waterfall用法
		//第一个callback函数调用时,第一个参数如果是null,则调用下一个函数(去掉地一个null)
		//如果不是null则直接调用后面那个单独的回调函数.
		//数组内最后一个函数调用单独回调(带null)
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
                    	self.userSocketManager.idClientMapping[uid] = userSession;
                        userSession.isLogined = true;
                        userSession.id = uid;
                        userSession.uid = uid;
                        userSession.userInfo = data;
                        userSession.game = game;
                        userSession.onGetUserInfo();
                        userSession.send("user","loginAck",1,packetId,data);
                        self.sendServerList(userSession);
                        //无需再callback了
                        // callback(null, 'done');
                    } else {
                    	callback(-4,"no user info");
                    }
                });
            }
        ], function doneAll (err, result) {
            if (err) {
                logger.error("doneAll with err",err,result);
                userSession.send("user","loginAck",err,packetId,{e:"登录失败"})
            }
            
        });	
	},
    sendServerList : function(userSession) {
        //
        
        var data = this["genServerListFor_"+userSession.game](userSession);
        userSession.send("user","serverListNot",1,0,data);
    },
    genServerListFor_zha : function(userSession) {
        var servers = this.gameServers[userSession.game];

    }

});
module.exports = LobbyServer;