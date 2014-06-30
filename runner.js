function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
      child = spawn(cmd, args),
      me = this;
    me.exit = 0;  // Send a cb to set 1 when cmd exits
    child.stdout.on('data', function (data) { cb_stdout(me, data) });
    child.stdout.on('end', function () { cb_end(me) });
}

global.Class = require('node.class');

var config = require('app/config/config')
var allServers = [];
for (var typ in config.servers) {
    if (config.servers[typ].runTyp === "nodejs") {
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