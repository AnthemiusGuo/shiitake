var BaseRobot = Class.extend({
	init : function(forTyp,uid) {
		this.for = forTyp;
		this.isConnect = false;
		this.isLogined = false;
		this.uid = uid;
		this.userInfo = null;
		this.aiTyp = 'null';
		this.packetId = 0;
		this.connected = false;
		this.ready = false;
		this.socket = null;
		this.ticket = "FakeTicketToOverwrite";
	},
	setInfo : function(data){
		this.userInfo = data;
	},
	call : function(category,method,data){
		var dd = new Date();
		var ts = dd.getTime();
		var packet = {'c':category,'m':method,'d':data,'t':ts,'s':this.packetId,'r':1};
		this.socket.send(JSON.stringify(packet));
		this.packetId++;
	},
	upstream : function(category,method,data){

	}

});

module.exports = BaseRobot;