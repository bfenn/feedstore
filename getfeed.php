<?php
if (!isset($_REQUEST['feed'])) {
	return;
}
	
header('Content-type: text/html');
header('Access-Control-Allow-Origin: *');

echo file_get_contents($_REQUEST['feed']);

?>
