<?php
if (!isset($_REQUEST['feed'])) {
	return;
}
	
header('Content-type: text/html');
header('Access-Control-Allow-Origin: *');

echo file_get_contents('https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q='.$_REQUEST['feed'].'&num020');

?>
