<?php
/**
 * Created by PhpStorm.
 * File: index.php
 * User: semihonay
 * Date: 5.06.2017
 * Time: 20:12
 */

/**
 * @param $data
 * @param $ip
 * @param $port
 */
function sendUDPdata($data, $ip, $port)
{
    if ($socket = socket_create(AF_INET, SOCK_DGRAM, SOL_UDP)) {
        socket_sendto($socket, $data, strlen($data), 0, $ip, $port);
        socket_close($socket);
    } else {
        print('Error');
    }
}

function generateRandomString($length = 10)
{
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

    $socket = sendUDPdata(stripslashes(json_encode([
        "name" => "test-data",
        "version" => "0.0.0",
        "payload" => ["key" => rand(0, 1000), "msg" => generateRandomString(6)],
    ], JSON_UNESCAPED_SLASHES )), '192.168.132.174', 33333);
    closeUDPconection($socket);
    sleep(1);