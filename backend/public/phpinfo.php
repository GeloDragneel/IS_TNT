<?php
phpinfo();

$ch = curl_init("https://api-mt1.pusher.com");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Curl error: ' . curl_error($ch);
} else {
    echo 'Success';
}
curl_close($ch);