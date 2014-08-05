var BaseServer = require('app/base/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info);
		this.uidLobbyIdMapping = {};
		this.uidUserMapping = {};
		// this.lobbySessionUidMapping = {};
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
	},
	onEnterGame : function(clientSession,ret,ts,data,packetSerId) {
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
		var user = new User(lobbyId,clientSession);

		this.uidUserMapping[uid] = user;

		user.isLogined = true;
		user.id = uid;
		user.uid = uid;
		user.userInfo = data.userInfo;
		user.is_robot = (data.userInfo.is_robot==1);
		user.onGetUserInfo();
		user.send("user","enterGameAck",1,packetSerId,{})
		
		// if (!F.isset(this.lobbySessionUidMapping[clientSession.id])){
		// 	this.lobbySessionUidMapping[clientSession.id] = {};
		// }
		// this.lobbySessionUidMapping[clientSession.id][data.uid] = 1;
		
	},
	checkCanEnterGame : function(data) {
		utils.PLEASE_OVERWRITE_ME();
		return [1,""];
	}
	
});
module.exports = GameServer;