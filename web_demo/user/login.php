<?
function genTicket($uid){
	global $redis;
	$now = time();
	$redis_key = "user/ticket/".$uid;
	$ticket = md5(substr(md5($now.$uid."XWR555"),5,32-5));
	$redis->set($redis_key,$ticket);
	return $ticket;
}
$uid = $_GET['uid'];
$redis_key = "user/ticket/".$uid;
$ticket = $redis->get($redis_key);
if ($ticket===false){
	$json_rst['data']['ticket'] = genTicket($uid);
} else {
	$json_rst['data']['ticket'] = $ticket;
}


?>