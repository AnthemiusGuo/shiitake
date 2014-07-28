var BaseRobot = require('app/apps/robot/baseRobot');
var ZhaRobot = BaseRobot.extend({
	init : function(forTyp,uid) {
		this._super(forTyp,uid);
		//ai类型, 无倾向, 激进型, 保守型, 疯狂型, 作弊型
		this.aiTyps = ["null","agressive","possive","ganghu","cheater"];
		//作弊型机器人 告诉服务器我是作弊型的, 服务器开牌时候优先给cheater大牌

		this.onTableTyps = ["user","zhuang"]
	}
});
module.exports = ZhaRobot;