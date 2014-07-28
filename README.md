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



note
----------

* for match server and so on, one connection at once!!! because 

e.g.
----------
* node app.js --typ=lobby --id=lobby-server-1 
* node app.js --typ=zha --id=zha-srv-1-1
* node app.js --typ=robot --id=robot-server-zha