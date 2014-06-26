var config = module.exports;
var PRODUCTION = process.env.NODE_ENV === "production";

config.express = {
	port: 3000,
	ip: "127.0.0.1"
};

config.redis = {
	port: 27017,
	host: 'localhost'
};

config.mysql = {
	port: 3306,
	host: 'localhost'
};

if (PRODUCTION) {
  
} else {

}