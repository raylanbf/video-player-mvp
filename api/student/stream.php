<?php
// /api/student/stream.php
// Proxy de streaming para proteger a URL real do MP4.

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

// Stream do vídeo (pass-through)
header("Content-Type: video/mp4");
header("Cache-Control: no-cache");

if (ob_get_level()) {
    ob_end_clean();
}

readfile($realVideoUrl);
exit;
?>
