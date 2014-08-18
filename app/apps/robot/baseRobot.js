var BaseRobot = Class.extend({
	init : function(forTyp,uid) {
		this.for = forTyp;
		this.isConnect = false;
		this.uid = uid;
		this.userInfo = null;
		this.aiTyp = 'null';
		this.packetId = 0;
		this.connected = false;
		this.ready = false;
		this.socket = null;
		this.ticket = "FakeTicketToOverwrite";
		this.targetServerId = "";
	},
	setInfo : function(data){
		this.userInfo = data;
	},
	initCredits : function(credits){
		this.userInfo.credits = credits;
		
	},
	call : function(category,method,data){
		logger.info("robot call",category,method,data,"this.targetServerId",this.targetServerId);
		data.uid = this.uid;
		if (this.targetServerId==""){
			logger.error("no target server ID !!!");
			return;
		}
		rpc.call(this.for,category,method,{serverId:this.targetServerId},data,function(category,method,ret,data,req){
			if (F.isset(this['onMsg_'+category+'_'+method])) {
				this['onMsg_'+category+'_'+method](ret,data);
			} else {
				this.onMsg(category,method,ret,data);
			}
		}.bind(this));		
	},
	upstream : function(category,method,data){

	},
	getSendToGameInfo: function() {
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
	onMsg : function(category,method,r,data){
		logger.debug("robot onMsg",category,method,r,data);
	},
});

module.exports = BaseRobot;