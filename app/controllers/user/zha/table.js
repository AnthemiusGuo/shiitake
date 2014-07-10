var BaseController = require("app/controllers/user/base/table");
var GameCtrller = BaseController.extend({
	init : function (app){
		this._super(app);
	}
});

module.exports = GameCtrller;