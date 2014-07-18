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
	"zha-srv-1-1":{
				"roomId":11,
				'room_name' :'初级场',
			    'room_limit_low' :1000,
			    'room_limit_kick' :1000,
			    'room_limit_high' :2000000,
			    "tableIdBegin":1,"tableIdEnd":99,
			    "maxUserPerTable":100,
				'room_zhuang_limit_low' :100000,
			    'room_zhuang_limit_high' :43990000,
			    'ratio' :0.0783,
			    'room_desc' :'1千',
				'order':1,
				'openBig':{
					//概率基准为10000, 填值为万分之几,不填的表示全随机,
					//例如填"baozi":[100,105],表示庄家1/100出豹子,闲家105/10000 出豹子,99%走普通随机,普通随机中当然也还有豹子的概率
					//顺子中强制排除了同花顺
					"duizi":[5000,4000],
					"shunzi":[2000.1800],
					"jinhua":[200,180],
					"tonghuashun":[100,90],
					"baozi":[50,40],
				},
				'userZhuang':false
			},
	"zha-srv-1-2":{
				"roomId":12,
				'room_name' :'初级场',
			    'room_limit_low' :1000,
			    'room_limit_kick' :1000,
			    'room_limit_high' :2000000,
			    "tableIdBegin":1,"tableIdEnd":99,
			    "maxUserPerTable":100,
				'room_zhuang_limit_low' :100000,
			    'room_zhuang_limit_high' :43990000,
			    'ratio' :0.0783,
			    'room_desc' :'1千',
				'order':1,
				'openBig':{
					"baozi":[110,100],
					"tonghuashun":[1100.1000]
				},
				'userZhuang':false
			},
	"zha-srv-2-1":{
				"roomId":21,
				'room_name' :'中级场',
			    'room_limit_low' :1000000,
			    'room_limit_kick' :100000,
			    'room_limit_high' :0,
			    "tableIdBegin":1,"tableIdEnd":99,
			    "maxUserPerTable":100,
				'room_zhuang_limit_low' :10000000,
			    'room_zhuang_limit_high' :100000000,
			    'ratio' :0.0467,
			    'room_desc' :'100万',
				'order':2,
				'openBig':{
					"baozi":[110,100],
					"tonghuashun":[1100.1000]
				},
				'userZhuang':true
			},
	"zha-srv-3-1":{
				"roomId":31,
				'room_name' :'高级场',
			    'room_limit_low' :5000000,
			    'room_limit_kick' :500000,
			    'room_limit_high' :0,
			    "tableIdBegin":1,"tableIdEnd":99,
			    "maxUserPerTable":100,
				'room_zhuang_limit_low' :50000000,
			    'room_zhuang_limit_high' :1000000000,
			    'ratio' :0.0419,
			    'room_desc' :'500万',
				'order':3,
				'openBig':{
					"baozi":[110,100],
					"tonghuashun":[1100.1000]
				},
				'userZhuang':true
			},
}