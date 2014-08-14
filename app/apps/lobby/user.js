var BaseUser = require('framework/base/baseUser');
var LobbyUser = BaseUser.extend({
	init : function(uid) {
		this._super(uid);
		this.gameId = 0;
		this.gameServerId = "";
	},
	onGetUserInfo : function(){
		
	},
	onEnterGame : function(gameId,reEnterInfo,targetServerId){
        this.gameId = gameId;
        this.reEnterInfo = reEnterInfo;
        this.gameServerId = targetServerId;
	},
	onLeaveGame : function(){
		this.gameId = 0;
        this.reEnterInfo = {};
        this.gameServerId = "";
	},
	getUserShowInfo : function() {
		if (!F.isset(this.userInfo)){
			//返回错误信息
			return {
				uid : this.userInfo.uid,
				uname : '[未知]',
				avatar_url : '',
				avatar_id : 0,
				level : 0,
				vip_level: 0
			}

		}
		return {
			uid : this.userInfo.uid,
			uname : this.userInfo.uname,
			avatar_url : this.userInfo.avatar_url,
			avatar_id : this.userInfo.avatar_id,
			level : this.userInfo.level,
			vip_level: this.userInfo.vip_level,
		}
	},
	getSendToGameInfo : function() {
		if (!F.isset(this.userInfo)){
			//返回错误信息
			return {
				uid : this.userInfo.uid,
				uname : '[未知]',
				avatar_url : '',
				avatar_id : 0,
				credits : 0,
				total_credits : 0,
				level : 0,
				vip_level: 0,
				exp : 0,
				is_robot : 0
			}

		}
		return {
			uid : this.userInfo.uid,
			uname : this.userInfo.uname,
			avatar_url : this.userInfo.avatar_url,
			avatar_id : this.userInfo.avatar_id,
			credits : this.userInfo.credits,
			total_credits : this.userInfo.total_credits,
			level : this.userInfo.level,
			vip_level: this.userInfo.vip_level,
			exp : 0,
			is_robot : this.userInfo.is_robot
		}
	},
});
module.exports = LobbyUser;