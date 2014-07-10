function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
      child = spawn(cmd, args),
      me = this;
    me.exit = 0;  // Send a cb to set 1 when cmd exits
    child.stdout.on('data', function (data) { cb_stdout(me, data) });
    child.stdout.on('end', function () { cb_end(me) });
}

global.Class = require('node.class');
var log4js = require('log4js');
global.logger = log4js.getLogger();
logger.info("Runner Begin");

var config = require('app/config/config')
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


var allServers = [];
for (var typ in config.servers) {
    if (config.servers[typ].runTyp === "nodejs") {
        dmManager.delKVDBGlobal("global/srvSta/"+typ);
        var thisServer = config.servers[typ];
        for (var id in thisServer.serverList) {
          var foo = new cmd_exec('node', ["app.js",'--typ='+typ,'--id='+id], 
            function (me, data) {me.stdout += data.toString();},
            function (me) {me.exit = 1;}
          );
          allServers.push(foo);
        }
    }
}

function log_console() {
  for (var id in allServers) {
    console.log(allServers[id].stdout);
  }
}
setTimeout(
  // wait 0.25 seconds and print the output
  log_console,
250);