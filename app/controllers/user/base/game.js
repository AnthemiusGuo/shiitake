var BaseController = require("framework/base/baseController");
var GameCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},
	joinTableReq : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["prefer"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		//进桌
		var preferTableId = data.prefer;
		if (preferTableId==0) {
			
		}
	}
});

module.exports = GameCtrller;