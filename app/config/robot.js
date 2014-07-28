var config = module.exports;

if (process.env.NODE_ENV === undefined) {
	var PRODUCTION = "development";//"production";
} else {
	var PRODUCTION = process.env.NODE_ENV;
}
if (PRODUCTION==="production") {

} else {

}
/*var config_paixing_names = {
	"sanpai":1,
	"duizi":2,
	"shunzi":3,
	"jinhua":4,
	"tonghuashun":5,
	"baozi":6
};
*/

config.servers = {
	"robot-server-zha":{
		"room_11":{
			forRoom:11,
			
		},
		"room_12":{
			forRoom:12,

		},
		"room_21":{
			forRoom:21,

		},
		"room_31":{
			forRoom:31,

		},
}