var BaseController = require("app/controllers/client/base/BaseController");
var UserCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	},
	login : function(userSession,ret,ts,data,packetSerId) {
		//{"c":"user","m":"login","d":{"uid":1},"t":1404292893355,"s":0,"r":1}
		
	}
});

module.exports = UserCtrller;