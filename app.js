global.Class = require('node.class');
global.utils = require('app/apps/base/baseFunction');
global.F = require('phpjs');

global.rootDir = __dirname;
var config = require('app/config/config')
//refernce https://github.com/mranney/node_redis/
//refernce https://github.com/felixge/node-mysql

//nohup node app.js --typ=lobby --id=lobby-server-1 & >room_1.out

// var init_param = {typ:"lobby",id:"lobby-server-1"};
var init_param = {typ:"zha",id:"zha-server-1"};

process.argv.forEach(function (val, index, array) {
    if (index<2){
      //node and app
      return;
    }
    var kv = val.replace(/\-\-/,'').split('=');
    init_param[kv[0]] = kv[1];
});
console.log(init_param);

/*prepare*/
var WebSocketServer = require('ws').Server;
var ClientUser = require('app/apps/'+init_param.typ+'/client')

DmManager = require('app/dataModels/dataModelManager');
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

    //   console.log('The solution is: ', rows[0].solution);
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
        console.log("Error " + err);
    });
    //client.mset(["test keys 1", "test val 1", "test keys 2", "test val 2"], function (err, res) {});

    //client.mset("test keys 1", "test val 1", "test keys 2", "test val 2", function (err, res) {});

    //client.set("some key", "some val");
    //client.set(["some other key", "some val"]);

    //client.get("missingkey", function(err, reply) {
    // reply is null when the key is missing
    //    console.log(reply);
    //});

    // kvdb.set("string key", "string val", redis.print);
    // kvdb.hset("hash key", "hashtest 1", "some value", redis.print);
    // kvdb.hset(["hash key", "hashtest 2", "some other value"], redis.print);
    // kvdb.hkeys("hash key", function (err, replies) {
    //     console.log(replies.length + " replies:");
    //     replies.forEach(function (reply, i) {
    //         console.log("    " + i + ": " + reply);
    //     });
    //     kvdb.quit();
    // });
}

console.log("init rpc calling...");
var RPC = require('app/base/rpc');
global.rpc = new RPC(config.servers,init_param.typ);

//e.g.
//rpc.run("lobby","recudeCoin",{uid:1},{uid:1,count:1000});

var LogicApp = require('app/apps/'+init_param.typ+'/'+init_param.typ);
global.logicApp = new LogicApp(init_param.typ,init_param.id,config.servers[init_param.typ].serverList[init_param.id]); 
logicApp.run();


var serversInfo = config.servers[init_param.typ].serverList[init_param.id];

if (serversInfo.frontend) {
    //支持对用户接入,监听用户端口
    global.frontServer = new WebSocketServer({port: serversInfo.clientPort});
    frontServer.userClients = {};

    frontServer.on('connection', function(socket) {
        console.log('someone connected');
        var clientSession = new ClientUser(socket);
        logicApp.onNewUserSocketConnect(clientSession,socket);
        socket.on('message', function(message) {
            console.log(message);
            logicApp.onClientMsg(socket,message)
        })
        .on('close',function(code, message){
            console.log("===closeclient");
            logicApp.onCloseUserSocketConnect(socket);
            clientSession.onCloseSocket();
            clientSession = null;
        });
    });
}

//对服务器RPC接口
global.backServer = new WebSocketServer({port: serversInfo.port});
backServer.rpcClients = {};

backServer.on('connection', function(socket) {
    console.log('someone connected');
    
    socket.on('message', function(message) {
        logicApp.onRPCMsg()
    })
    .on('close',function(code, message){
        console.log("===closeclient");
        
    });
});


