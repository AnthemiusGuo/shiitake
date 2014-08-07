var BaseServer = require('app/base/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.uidLobbyIdMapping = {};
		this.uidUserMapping = {};
		//所有接入的lobby列表，用于rpc断线时候设置玩家数据，结构[lobbyId][uid]
		//这样RPC故障时候可以迅速设置所有用户离线
		this.lobbyIdUidMapping = {};
		// this.lobbySessionUidMapping = {};
	},
	doSinglecast : function(uid,category,method,data){
		if (!F.isset(this.uidLobbyIdMapping[uid])) {
			logger.error("doSinglecast",uid,category,method);
			return;
		}
		rpc.call("lobby","singlecast","user",{serverId:this.uidLobbyIdMapping[uid]},{uid:uid,info:{c:category,m:method,d:data}})
	},
	login : function(uid,userSession) {
		this._super(uid,userSession);
		//rpc call lobby that user is in here, don't let him go anywhere else
		//or use redis????
	},
	onAllReady: function() {
		this._super();
		var balance = this.genLoadBalance();
		//通知大厅我好了
		rpc.typBroadcastCall("lobby","rpc","serverReady",{typ:this.typ,id:this.id,balance:balance});
	},
	onReReady: function() {
		this._super();
		var balance = this.genLoadBalance();
		//通知大厅我好了
		rpc.typBroadcastCall("lobby","rpc","serverReady",{typ:this.typ,id:this.id,balance:balance});
	},
	onPause : function(reason) {
		this._super(reason);
		//通知大厅我挂了
		rpc.typBroadcastCall("lobby","rpc","serverPause",{typ:this.typ,id:this.id,reason:reason});
		if (reason.t == "rpcClose") {
			if (reason.sT == "lobby") {
				//大厅断了比较严重，要把游戏的相关用户全部设置为离线
				var lobbyId = reason.sId;

				if (F.isset(this.lobbyIdUidMapping[lobbyId])) {
					for (var uid in this.lobbyIdUidMapping[lobbyId]) {
						if (F.isset(this.uidUserMapping[uid])) {
							this.uidUserMapping[uid].onCloseSocket();
						}
					}
					this.lobbyIdUidMapping[lobbyId] = null;
				}
			}
		}
	},
	onEnterGame : function(clientSession,data,packetSerId) {
		//大厅通知游戏接客
		//各种判断待实现
		var checkCanEnterGame = this.checkCanEnterGame(data);
		if (checkCanEnterGame[0]<0) {
			clientSession.sendErr(-100+checkCanEnterGame[0],checkCanEnterGame[1],packetSerId);
			return;
		}
		//可以进入的话，存入uid和lobby对应表
		var uid = data.uid;
		var lobbyId = data.lobbyId;
		
		this.uidLobbyIdMapping[uid] = lobbyId;

		//各种底层关注信息
		if (!F.isset(this.lobbyIdUidMapping[lobbyId])) {
			this.lobbyIdUidMapping[lobbyId] = {};
		}
		this.lobbyIdUidMapping[lobbyId][uid] = 1;


		var user = new User(lobbyId,clientSession);

		this.uidUserMapping[uid] = user;

		user.isConnect = true;
		user.id = uid;
		user.uid = uid;
		user.userInfo = data.userInfo;
		user.is_robot = (data.userInfo.is_robot==1);
		user.onGetUserInfo();

		user.send("game","enterGameAck",1,packetSerId,this.genEnterGameAck(uid));
	},
	checkCanEnterGame : function(data) {
		utils.PLEASE_OVERWRITE_ME();
		return [1,""];
	},
	genEnterGameAck : function(uid) {
		utils.PLEASE_OVERWRITE_ME();
		return {};
	}
	
});
module.exports = GameServer;