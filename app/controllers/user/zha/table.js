var BaseController = require("app/controllers/user/base/table");
var GameCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},
	askZhuangReq : function(userSession,ret,ts,data,packetSerId) {
		// if (!utils.checkParam(data,["men","point"])) {
		// 	userSession.sendErrPackFormat(packetSerId);
		// 	return;
		// }
		
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

		userSession.table.onAskZhuang(userSession.uid,data,packetSerId);
	}
});

module.exports = GameCtrller;