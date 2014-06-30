var BaseServer = require('app/app/baseApp');
var GameServer = BaseServer.extend({
	init : function(typ,id,info) {
		this._super(typ,id,info)
	},
	run : function() {
		setTimeout(function(){
			this.onUpdate();
		}, 1000);
	}
	onUpdate : function() {
		
	}
});
module.exports = GameServer;