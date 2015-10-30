<?php
if (!isset($_REQUEST['feed'])) {
	return;
}
	
header('Content-type: text/html');
header('Access-Control-Allow-Origin: *');

$cachefile = 'cache/' . md5($_REQUEST['feed']);

// cache exists and less than one hour old
if (file_exists($cachefile) && (time()-filemtime($cachefile)) < 3600) {
    echo file_get_contents($cachefile);
    return;
}

file_put_contents($cachefile, file_get_contents('https://ajax.googleapis.com/ajax/services/feed/load?v=2.0&q='.$_REQUEST['feed'].'&num=300'));
echo file_get_contents($cachefile);

?>
