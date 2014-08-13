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

server structure
----------
server typs for framework

* Connector server : as lobby server for some typ game
* Game Server : for some typ game
* Event Driver : Event for games
* Upstream Server : Http server

server typ for example game
* Lobby Server : inher... from Connector server
* Zha : inher from game server
* robot : a robot server for games 


note
----------

* for match server and so on, one connection at once!!! because 

