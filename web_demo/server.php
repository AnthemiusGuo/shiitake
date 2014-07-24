<?php
#https://github.com/nicolasff/phpredis
#install it first

function genTicket($uid){
	global $redis;
	$now = time();
	$redis_key = "user/ticket/".$uid;
	$ticket = md5(substr(md5($now.$uid."XWR555"),5,32-5));
	$redis->set($redis_key,$ticket);
	//一小时过期
	$redis->setTimeout($redis_key, 3600);
	return $ticket;
}

header ("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1 
header ("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

if (!isset($_GET['m'])){
	$m = "index";
} else {
	$m = $_GET['m'];
}

if (!isset($_GET['a'])){
	$a = "index";
} else {
	$a = $_GET['a'];
}
$json_rst = array('c'=>$m,'m'=>$a,'ret'=>-1,'retStr'=>'','data'=>array());

if (isset($_POST['data'])) {
	$input_data = json_decode($_POST['data']);
}
$redis = new Redis();
$redis->connect('127.0.0.1'); 
require($m."/".$a.".php");


echo json_encode($json_rst);