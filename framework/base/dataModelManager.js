var DataModelManager = Class.extend({
	init : function() {
		this.dms = {};
	},
	getData: function(category,method,param,cb){
		if (!F.isset(this.dms[category])) {
			var DM = require('app/dataModels/'+category);
			this.dms[category] = new DM();
		}
		this.dms[category]["get"+method](param,cb);
	},
	getKVDBGlobal: function(k){
		var key = "global/"+k;
		
	},
	setKVDBGlobal: function(k,v){

	}
});
module.exports = DataModelManager;