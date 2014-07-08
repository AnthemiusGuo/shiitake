<?php
$json_rst['ret'] = 1;
$json_rst['data']['req'] = $input_data;
$json_rst['data']['ack'] = array("ts"=>time(),"ticket"=>md5("abc123"));