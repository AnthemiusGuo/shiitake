var GameCtrller = require("app/controllers/user/base/game");
var TheGameCtrller = GameCtrller.extend({
	init : function (app){
		this._super(app);
	},
	joinTable : function(userSession,ret,ts,data,packetSerId) {
		logger.debug("checking joinTable!");
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["prefer"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//进桌
		var tableId = this.app.findTable(data.prefer);
		logger.debug("find table ID:"+tableId);
		this.app.joinTable(tableId,userSession);
	}
});

module.exports = TheGameCtrller;