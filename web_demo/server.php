<?php
#https://github.com/nicolasff/phpredis
#install it first
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