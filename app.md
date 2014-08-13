* 数据三层缓存机制：
1. 数据库层，采用mongodb
2. 缓存层，采用redis
3. 持久化内存

* 对于用户数据，lobby将维护登录后用户数据在内存层，定期回收内存，任何更新会更新数据的最后更新字段。定期执行整理脚本，将超时数据回收。
* game不持久化用户数据，以局为单位每次开局现场读取后面逻辑，结束写回，并且通知lobby刷新内存
* 缓存层缓存经常访问的数据，全局表数据等。由于redis的设置和超时是两条命令，因此不频繁设置超时，而是采用每次初始化直接设置86400的超时时间，lobby持久化内存内记录上次写入时间，在lobby涉及到一些操作时候手动检查。
* 

e.g.
----------
* node app.js --typ=lobby --id=lobby-server-1 

* node app.js --typ=zha --id=zha-srv-1-1

* node app.js --typ=robot --id=robot-server-zha