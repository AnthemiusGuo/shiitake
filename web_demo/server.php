<?php
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
require($m."/".$a.".php");

echo json_encode($json_rst);