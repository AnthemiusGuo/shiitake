var BaseServer = require('app/base/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	login : function(uid,userSession) {
		this._super(uid,userSession);
		//rpc call lobby that user is in here, don't let him go anywhere else
		//or use redis????
	},
	onAllReady: function() {
		this._super();
		//通知大厅我好了
		rpc.typBroadcastCall("lobby","rpc","serverReady",{typ:this.typ,id:this.id});
	},
	onReReady: function() {
		this._super();
		//通知大厅我好了
		rpc.typBroadcastCall("lobby","rpc","serverReady",{typ:this.typ,id:this.id});
	},
	onPause : function(reason) {
		this._super(reason);
		//通知大厅我挂了
		rpc.typBroadcastCall("lobby","rpc","serverPause",{typ:this.typ,id:this.id,reason:reason});
	},
	
});
module.exports = GameServer;