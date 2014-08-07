var BaseClient = require('framework/base/baseClient');
var LobbyClient = BaseClient.extend({
	init : function(socket) {
		this._super(socket);
		this.gameId = 0;
		
	},
	login : function(uid) {
		this.isLogined = true;
		this.uid = uid;
	},
	onGetUserInfo : function(){
		
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
module.exports = LobbyClient;