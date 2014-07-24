<?
$uid = $_GET['uid'];
$redis_key = "user/ticket/".$uid;
$rst = $redis->setTimeout($redis_key, 3600);
if ($rst) {
	$json_rst['ret'] = 1;
} else {
	$json_rst['data']['ticket'] = genTicket($uid);
	$json_rst['ret'] = 1;
}

?>