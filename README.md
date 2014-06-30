shiitake
========

a distribution nodejs game server structure, based on websocket

depends on:
--------

Redis

Mysql

ws for websocket

Installation:
---------

npm install


Run
---------

export NODE_ENV=production

or

export NODE_ENV=development

code structure
----------
app/	all codes
app/app 	logic codes of init/time circle for per server
app/base  	base functions/classes
app/controllers		rpc functions
app/rpc 	rpc codes for connect to other rpc servers 