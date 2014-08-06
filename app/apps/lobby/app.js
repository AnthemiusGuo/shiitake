var BaseServer = require('framework/base/baseConnectorServer');
var LobbyServer = BaseServer.extend({
	
    prepare : function() {
        this.LOGIN_CACHE_EXPIRE = 3600;
        //for zha, 重新整理kv为基于room的
        this.config_zha = require('app/config/zha');
        this.prepareZhaRoomList();

    },
    prepareZhaRoomList : function() {
        this.zhaRoomList = {};
        this.zhaRoomServerList = [];
        for (var k in this.config_zha.rooms) {
            this.zhaRoomList[k] = {
                "roomId":this.config_zha.rooms[k].roomId,
                'room_name' :this.config_zha.rooms[k].room_name,
                'room_limit_low' :this.config_zha.rooms[k].room_limit_low,
                'room_limit_high' :this.config_zha.rooms[k].room_limit_high,
                'room_desc' :this.config_zha.rooms[k].room_desc,
                'order':this.config_zha.rooms[k].order,
                'userZhuang':this.config_zha.rooms[k].userZhuang,
                'online':false
            }
            this.zhaRoomServerList[this.config_zha.rooms[k].roomId] = [];
        }
        for (var k in config.servers.zha.serverList) {
            var v = config.servers.zha.serverList[k];
            if (!F.isset(this.zhaRoomList["zha-room-"+v.roomId])) {
                logger.error("!!! config for zha error: no roomId for ",v.roomId);
                continue;
            }
            this.zhaRoomList["zha-room-"+v.roomId].online = true;
            this.zhaRoomServerList[v.roomId].push(k);
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
                        self.sendRoomList(userSession);
                        //存在redis里面，知道这个用户最近都在我这，php不要再分配给其他lobby了
                        var real_key = "user/lobby/"+uid;
                        kvdb.set(real_key,self.id,function(ret,res){
                            //
                            kvdb.expire(real_key,self.LOGIN_CACHE_EXPIRE,redis.print);
                            //只要用户还活着，定期要刷新这个key
                        })
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
    sendRoomList : function(userSession) {
        //改为单入口模式后简单了，不需要再下发服务器列表给游戏了，只需要游戏房间列表
        //剩下的都在后端自己实现
        userSession.send("user","roomListNot",1,0,{roomList:this.zhaRoomList});
    },
    doEnterGame : function(gameModule,data,userSession,packetSerId){
        
        switch (gameModule) {
            case 'zha':
                this.doEnterGameZha(data,userSession,packetSerId);
                break;
            default:
                break;
        }

        
    },
    doEnterGameZha : function(data,userSession,packetSerId){
        var servers = this.gameServers['zha'];
        var roomId = data.roomId;

        //负载均衡，扔人数比例最少的一个出来
        var min_v = 1;
        var targetServerId = "";
        for (var i = 0; i < this.zhaRoomServerList[roomId].length; i++) {
            var serverId = this.zhaRoomServerList[roomId][i];
            logger.debug("checking for server",serverId,servers[serverId]);
            if (servers[serverId].status<=0) {
                continue;
            }

            if (servers[serverId].lb.percent<=min_v) {
                targetServerId = serverId;
                min_v = servers[serverId].lb.percent;
            }
        };

        if (targetServerId == "") {
            userSession.send("game","enterGameAck",-1,packetSerId,{e:"这个分类尚无准备好的服务器"});
            return;
        }

        //拿到找到的服务器
        rpc.call("zha","game","enterGameReq",{serverId:targetServerId},{uid:userSession.uid,lobbyId:this.id,userInfo:userSession.getSendToGameInfo()},function(category,method,ret,data,req){
            //登录回调
            if (ret >0) {
                userSession.gameId = config.GAME_IDS.zha;
                userSession.roomId = data.roomId;
                userSession.gameServerId = targetServerId;
                userSession.send("game","enterGameAck",1,packetSerId,data);
            } else {
                userSession.send("game","enterGameAck",-1,packetSerId,data);
            }
        }.bind(this));
    },
    onAllReady: function(){
        this._super();
        this.uidUserMapping = this.userSocketManager.idClientMapping;
    }
});
module.exports = LobbyServer;