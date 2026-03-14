<?php
// /api/student/stream.php
// Proxy de streaming com Range Requests (HTTP 206) usando cURL.
// cURL é mais confiável que fopen em hospedagem compartilhada (Hostinger).

$encodedUrl = $_GET['url'] ?? '';
if (!$encodedUrl) {
    http_response_code(404);
    die("Vídeo não encontrado.");
}

$realVideoUrl = base64_decode(urldecode($encodedUrl));

// Validação básica de URL
if (!filter_var($realVideoUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    die("URL inválida.");
}

// Se cURL não estiver disponível, redireciona direto para a URL real
if (!function_exists('curl_init')) {
    header("Location: $realVideoUrl", true, 302);
    exit;
}

// ---- Descobre tamanho e tipo do arquivo via HEAD request ----
$ch = curl_init($realVideoUrl);
curl_setopt_array($ch, [
    CURLOPT_NOBODY         => true,   // HEAD request
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => false,
]);
curl_exec($ch);
$fileSize    = (int) curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'video/mp4';
$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Se não conseguiu acessar o arquivo, redireciona como fallback
if ($httpCode < 200 || $httpCode >= 400 || $fileSize <= 0) {
    header("Location: $realVideoUrl", true, 302);
    exit;
}

// ---- Processa Range Request ----
$start  = 0;
$end    = $fileSize - 1;
$length = $fileSize;

if (isset($_SERVER['HTTP_RANGE'])) {
    preg_match('/bytes=(\d+)-(\d*)/', $_SERVER['HTTP_RANGE'], $m);
    $start = (int)($m[1] ?? 0);
    $end   = isset($m[2]) && $m[2] !== '' ? (int)$m[2] : $fileSize - 1;
    if ($end >= $fileSize) $end = $fileSize - 1;
    $length = $end - $start + 1;
    http_response_code(206);
    header("Content-Range: bytes $start-$end/$fileSize");
} else {
    http_response_code(200);
}

// ---- Headers de resposta ----
// Remove application/* do content-type e força video
if (strpos($contentType, 'video') === false) {
    $contentType = 'video/mp4';
}
header("Content-Type: $contentType");
header("Accept-Ranges: bytes");
header("Content-Length: $length");
header("Cache-Control: no-cache");

// HEAD? Responde só com headers
if ($_SERVER['REQUEST_METHOD'] === 'HEAD') exit;

// ---- Stream via cURL com Range ----
if (ob_get_level()) ob_end_clean();

$ch = curl_init($realVideoUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => false,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 0,       // sem timeout (streaming longo)
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_RANGE          => "$start-$end",
    CURLOPT_WRITEFUNCTION  => function($ch, $data) {
        echo $data;
        flush();
        return strlen($data);
    },
]);
curl_exec($ch);
curl_close($ch);
exit;
