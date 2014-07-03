var config = module.exports;

if (process.env.NODE_ENV === undefined) {
	var PRODUCTION = "development";//"production";
} else {
	var PRODUCTION = process.env.NODE_ENV;
}
if (PRODUCTION==="production") {

} else {

}

config.servers = {
	"zha-server-1":{"roomId":1,"minEntry":1000,"maxEntry":10000,"tableIdBegin":1,"tableIdEnd":99}
}