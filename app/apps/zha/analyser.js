var Analyser = Class.extend({
	init : function() {
		this.date = this.getDate();
		this.tableAnalyse = {};
	},
	getDate: function() {
		var now = new Date();
		return now.getFullYear()+"/"+(now.getMonth()+1)+"/"+now.getDate();
	},
	initTable: function(tableId) {
		this.tableAnalyse[tableId] = {
			rounds : 0,
			allUserBets : 0,
			sysWin : 0,
			water : 0,
			robotWin : 0,
			zhuangWin : 0,
			zhuangWinRound : 0,
		};
	},
	add : function(tableId,data) {
		if (F.isset(this.tableAnalyse[tableId])){
			this.initTable[tableId];
		}

		for (var k in data) {
			if (F.isset(this.tableAnalyse[tableId][k])){
				this.tableAnalyse[tableId][k] += data[k];
			} else {
				this.tableAnalyse[tableId][k] = data[k];
			}
		}
		kvdb.hmset("analyse/zha/"+this.date,this.tableAnalyse[tableId],redis.print);
	}
});

module.exports = Analyser;