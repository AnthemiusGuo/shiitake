global.Class = require('node.class');
global.utils = require('framework/base/baseFunction');
global.F = require('phpjs');
global.async = require("async");
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
    global.redis = require("redis");
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
 var uid = 21;

var keys = {uid:uid};
var changes = {'credits':10000,'exp':1000,total_credits:10000};
dmManager.setDataChange("user","BaseInfo",keys,changes,function(ret,data){
    logger.info(ret,data);
});
// var Table =  require('app/apps/zha/table');
// var table = new Table(1,roomConfig);
// table.user_bet_info = {};
// table.user_bet_info['21']  = { '1': 1000 ,'2':1000,'3':1200,'4':10000} ;
// table.user_bet_info['22']  = { '1': 0 ,'2':0,'3':12000,'4':100} ;
// table.user_bet_info['23']  = { '1': 100 ,'2':20000,'3':0,'4':0} ;
// table.doOpen();

// var async = require('async');

// // async.waterfall([
// //     function (callback) {
// //         console.log('waterfall 1');
// //         setTimeout(function () {
// //             console.log('waterfall 1 done.');
// //             callback(null, 1);
// //         }, 500);
// //     },
// //     function (arg, callback) {
// //         console.trace('waterfall 2');
// //         setTimeout(function () {
// //             console.log('waterfall 2 done.');
// //             callback(null, arg + 1);
// //         }, 300);
// //     },
// //     function (arg, callback) {
// //         console.log('waterfall 3');
// //         setTimeout(function () {
// //             console.log('waterfall 3 done.');
// //             callback(null, arg + 1);
// //         }, 100);
// //     }
// // ], function (err) {
// //     if (err) { throw err; }
// //     console.log('waterfall all done.');
// // });
// var uid = 21;
// async.waterfall([
//             function verifyTicket(callback) {
//                 logger.debug("verifyTicket");
//                 var real_key = "user/ticket/"+uid;
//                 kvdb.get(real_key,function(err, reply) {
//                     logger.debug("verifyTicket result",reply);
//                     if (err) {
//                         callback(-2,err);
//                         return;
//                     }
//                     if (reply===null) {
//                         callback(-1);
//                         return;
//                     }
//                     //hit cache!!!
//                     callback(-2,reply);
//                 });
//             },
//             function getInfo(cache, callback){
//                 logger.debug("getInfo",cache);
//                 dmManager.getData("user","BaseInfo",{uid:uid},function(ret,data){
//                     logger.debug("getInfo result",ret,data);
//                     callback(null, data);
//                 });
//             },
//             function sendBack(data, callback){
//                 logger.debug("sendBack",data);
//                 // arg1 now equals 'three'
//                 callback(null, 'done');
//             }
//         ], function doneAll (err, result) {
//             logger.debug("doneAll",err,result);
//             if (err) {
//                 logger.error("doneAll with err",err,result);
//             }
//             //userSession.send("user","loginAck",ret,packetId,{e:"登录失败"})
//             // result now equals 'done'    
//         });