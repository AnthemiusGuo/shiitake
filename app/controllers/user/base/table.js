var BaseController = require("framework/base/baseController");
var GameCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},
	betReq : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		if (!utils.checkParam(data,["men","point"])) {
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		
		if (!F.isset(userSession.table)){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}
		if (!F.isset(userSession.uid) || userSession.uid<=0){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		if (!F.isset(userSession.table.userList[userSession.uid])){
			userSession.sendErrPackFormat(packetSerId);
			return;
		}

		userSession.table.onBet(userSession.uid,data.men,data.point,packetSerId);
	}
});

module.exports = GameCtrller;