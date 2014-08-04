<?

$uid = $_GET['uid'];
$redis_key = "user/ticket/".$uid;
$ticket = $redis->get($redis_key);
if ($ticket===false){
	$json_rst['data']['ticket'] = genTicket($uid);
} else {
	$json_rst['data']['ticket'] = $ticket;
	$redis->setTimeout($redis_key, 3600);
}
$json_rst['data']['lobby'] = array("host"=>"127.0.0.1","clientPort"=>3000);
$json_rst['ret'] = 1;
?>