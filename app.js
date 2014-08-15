global.Class = require('node.class');
global.utils = require('framework/base/baseFunction');
global.F = require('phpjs');
global.async = require("async");

// var agent = require('webkit-devtools-agent');
// agent.start()

var log4js = require('log4js');
log4js.replaceConsole();
global.logger = log4js.getLogger();

global.rootDir = __dirname;
global.config = require('app/config/config')
//refernce https://github.com/mranney/node_redis/
//refernce https://github.com/felixge/node-mysql

//nohup node app.js --typ=lobby --id=lobby-server-1 & >room_1.out

var init_param = {typ:"lobby",id:"lobby-server-1"};
// var init_param = {typ:"zha",id:"zha-server-1"};

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
var configInfo = config.servers[appTyp];
var serversInfo = config.servers[appTyp].serverList[appId];
async.parallel([
        function mysqlCon(callback){
            /*prepare mysql*/
            if (configInfo.dbMods.mysql && config.mysql!=undefined) {
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
                         callback(-1,err);
                    }
                    db.allReady = true;
                    logger.info('mysql connected as id ' + db.threadId);
                    callback(null);
                });

            } else {
                callback(null);
            }
        },
        function mongodbCon(callback){
            if (configInfo.dbMods.mongodb && config.mongodb!=undefined) {
                var MongoClient = require('mongodb').MongoClient;

            // Connect to the db
                global.ObjectId = require('mongodb').ObjectID,
                global.mongodb = {allReady:false};
                // Connect to the db
                MongoClient.connect("mongodb://"+config.mongodb.host+":"+config.mongodb.port+"/"+config.mongodb.db, function(err, db) {
                    if(!err) {
                        logger.info('mongodb connected');
                        mongodb = db;
                        mongodb.allReady = true;
                        callback(null);
                    } else {
                        logger.error("mongo db conntet failed",err);
                        callback(-2,err);
                    }
                });
            } else {
                callback(null);
            }
        },
        function redisCon(callback){
            /*prepare redis*/
            if (configInfo.dbMods.redis && config.redis!=undefined) {
                global.redis = require("redis");
                global.kvdb = redis.createClient();
                kvdb.allReady = false;
                // if you'd like to select database 3, instead of 0 (default), call
                // kvdb.select(3, function() { /* ... */ });
                kvdb.on("connect", function () {
                    logger.info('redis connected');
                    kvdb.allReady = true;
                    callback(null);
                }).on("error", function (err) {
                    logger.debug("redis Error " + err);
                    callback(-3,err);
                });
                
            } else {
                callback(null);
            }
        },


    ],
    // optional callback
    function(err, results){
        // the results array will equal ['one','two'] even though
        // the second function had a shorter timeout.
        if (err!=null) {
            logger.error("INIT FAILED!!!");
            process.exit();
            return;
        } 
        DmManager = require('framework/base/dataModelManager');
        global.dmManager = new DmManager();

        var LogicApp = require('app/apps/'+appTyp+'/app');
        global.logicApp = new LogicApp(appTyp,appId,serversInfo); 


        console.log("init rpc calling...");
        var RPC = require('framework/base/rpcManager');
        global.rpc = new RPC(config.servers,appTyp);

        logicApp.prepare();
        logicApp.run();
    }
);


//e.g.
//rpc.run("lobby","recudeCoin",{uid:1},{uid:1,count:1000});