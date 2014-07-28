var BaseRobot = Class.extend({
	init : function(forTyp,uid) {
		this.for = forTyp;
		this.isConnect = false;
		this.isLogined = false;
		this.uid = uid;
		this.userInfo = null;
		this.aiTyp = 'null';
	},
	setInfo : function(data){
		this.userInfo = data;
	}

});

module.exports = BaseRobot;