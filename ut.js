global.Class = require('node.class');
global.utils = require('framework/base/baseFunction');
global.F = require('phpjs');

var log4js = require('log4js');
log4js.replaceConsole();
global.logger = log4js.getLogger();

global.rootDir = __dirname;
var config = require('app/config/config')
//refernce https://github.com/mranney/node_redis/
//refernce https://github.com/felixge/node-mysql

//nohup node app.js --typ=lobby --id=lobby-server-1 & >room_1.out

//var init_param = {typ:"lobby",id:"lobby-server-1"};
var init_param = {typ:"zha",id:"zha-srv-1-1"};

process.argv.forEach(function (val, index, array) {
    if (index<2){
      //node and app
      return;
    }
    var kv = val.replace(/\-\-/,'').split('=');
    init_param[kv[0]] = kv[1];
});

global.appTyp = init_param.typ;
global.appId = init_param.id;

global.logger = log4js.getLogger(appTyp);
logger.info("App Begin");

//log4js.loadAppender('console');
// log4js.loadAppender('file');
//log4js.addAppender(log4js.appenders.file('logs/cheese.log'), 'cheese');

// var logger = log4js.getLogger('cheese');
logger.setLevel('ALL');
// OFF nothing is logged
// FATAL   fatal errors are logged
// ERROR   errors are logged
// WARN    warnings are logged
// INFO    infos are logged
// DEBUG   debug infos are logged
// TRACE   traces are logged
// ALL everything is logged

// logger.trace('Entering cheese testing');
// logger.debug('Got cheese.');
// logger.info('Cheese is Gouda.');
// logger.warn('Cheese is quite smelly.');
// logger.error('Cheese is too ripe!');
// logger.fatal('Cheese was breeding ground for listeria.');
/*prepare*/
var WebSocketServer = require('ws').Server;

var ClientUser = require('app/apps/'+appTyp+'/client');
var ClientRPC = require('framework/base/rpcClient');


/*prepare mysql*/
if (config.mysql!=undefined) {
    var mysql      = require('mysql');
    global.db = mysql.createConnection({
      host     : config.mysql.host,
      user     : config.mysql.user,
      password : config.mysql.password,
      database : config.mysql.db,
    });
    db.allReady = false;

    db.connect(function(err) {
        if (err) {
            logger.error('mysql error connecting: ' + err.stack);
            return;
        }
        db.allReady = true;
        logger.info('mysql connected as id ' + db.threadId);
    });

}

/*prepare redis*/
if (config.redis!=undefined) {
    var redis = require("redis");
    global.kvdb = redis.createClient();
    kvdb.allReady = false;
    // if you'd like to select database 3, instead of 0 (default), call
    // kvdb.select(3, function() { /* ... */ });
    kvdb.on("connect", function () {
        logger.info('redis connected');
        kvdb.allReady = true;
    }).on("error", function (err) {
        logger.debug("Error " + err);
    });
    
}

DmManager = require('framework/base/dataModelManager');
global.dmManager = new DmManager();

var LogicApp = require('app/apps/'+appTyp+'/'+appTyp);
global.logicApp = new LogicApp(appTyp,appId,config.servers[appTyp].serverList[appId]); 


var roomConfigs = require('app/config/zha');
var roomConfig = roomConfigs.servers["zha-srv-1-1"];

var Table =  require('app/apps/zha/table');
var table = new Table(1,roomConfig);
table.user_bet_info = {};
table.user_bet_info['21']  = { '1': 1000 ,'2':1000,'3':1200,'4':10000} ;
table.user_bet_info['22']  = { '1': 0 ,'2':0,'3':12000,'4':100} ;
table.user_bet_info['23']  = { '1': 100 ,'2':20000,'3':0,'4':0} ;
table.doOpen();