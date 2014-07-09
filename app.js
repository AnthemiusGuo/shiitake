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
var WebSocketServer = require('ws').Server;

var ClientUser = require('app/apps/'+appTyp+'/client');
var ClientRPC = require('framework/base/rpcClient');

DmManager = require('framework/base/dataModelManager');
global.dmManager = new DmManager();

/*prepare mysql*/
if (config.mysql!=undefined) {
    var mysql      = require('mysql');
    global.db = mysql.createConnection({
      host     : config.mysql.host,
      user     : config.mysql.user,
      password : config.mysql.password,
      database : config.mysql.db,
    });

    db.connect();

    // db.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
    //   if (err) throw err;

    //   logger.debug('The solution is: ', rows[0].solution);
    // });

    // db.end();
}

/*prepare redis*/
if (config.redis!=undefined) {
    var redis = require("redis");
    global.kvdb = redis.createClient();

    // if you'd like to select database 3, instead of 0 (default), call
    // kvdb.select(3, function() { /* ... */ });

    kvdb.on("error", function (err) {
        logger.debug("Error " + err);
    });
    //client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});

    //client.mset("test keys 1", "test val 1", "test keys 2", "test val 2", function (err, res) {});

    //client.set("some key", "some val");
    //client.set(["some other key", "some val"]);

    //client.get("missingkey", function(err, reply) {
    // reply is null when the key is missing
    //    logger.debug(reply);
    //});

    // kvdb.set("string key", "string val", redis.print);
    // kvdb.hset("hash key", "hashtest 1", "some value", redis.print);
    // kvdb.hset(["hash key", "hashtest 2", "some other value"], redis.print);
    // kvdb.hkeys("hash key", function (err, replies) {
    //     logger.debug(replies.length + " replies:");
    //     replies.forEach(function (reply, i) {
    //         logger.debug("    " + i + ": " + reply);
    //     });
    //     kvdb.quit();
    // });
}


var LogicApp = require('app/apps/'+appTyp+'/'+appTyp);
global.logicApp = new LogicApp(appTyp,appId,config.servers[appTyp].serverList[appId]); 
logicApp.run();

console.log("init rpc calling...");
var RPC = require('framework/base/rpcManager');
global.rpc = new RPC(config.servers,appTyp);

//e.g.
//rpc.run("lobby","recudeCoin",{uid:1},{uid:1,count:1000});

var serversInfo = config.servers[appTyp].serverList[appId];

if (serversInfo.frontend) {
    //支持对用户接入,监听用户端口
    global.frontServer = new WebSocketServer({port: serversInfo.clientPort});
    frontServer.userClients = {};

    frontServer.on('connection', function(socket) {
        logger.debug('someone connected');
        var clientSession = new ClientUser(socket);
        logicApp.userSocketManager.onNewSocketConnect(clientSession,socket);
        socket.on('message', function(message) {
            logger.trace(message);
            logicApp.onMsg("user",socket,message)
        })
        .on('close',function(code, message){
            logger.debug("===closed user client");
            logicApp.userSocketManager.onCloseSocketConnect(socket);
            clientSession.onCloseSocket();
            clientSession = null;
        });
    });
}

//对服务器RPC接口
global.backServer = new WebSocketServer({port: serversInfo.port});
backServer.rpcClients = {};

backServer.on('connection', function(socket) {
    logger.info('some server connected');
    var clientSession = new ClientRPC(socket);
    logicApp.rpcSocketManager.onNewSocketConnect(clientSession,socket);
    socket.on('message', function(message) {
        logicApp.onMsg("rpc",socket,message)
    })
    .on('close',function(code, message){
        logger.info("===closed rpc client");
        logicApp.rpcSocketManager.onCloseSocketConnect(socket);
        clientSession.onCloseSocket();
        clientSession = null;
    });
});