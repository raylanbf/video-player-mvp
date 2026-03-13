<?php
// /api/student/stream.php
// This is the proxy streaming mechanism translated to PHP to protect the real MP4 URI.

if (!isset($_GET['token'])) {
    http_response_code(403);
    die("Acesso Negado: Token ausente.");
}

$token = $_GET['token'];
// Validar tempo do token (Timestamp <= 2 horas)
try {
    $decoded = base64_decode($token);
    $parts = explode('-', $decoded);
    $timestamp = (int)end($parts);
    if (time() - ($timestamp / 1000) > 7200) {
        http_response_code(403);
        die("Acesso Negado: Token expirado.");
    }
} catch (Exception $e) {
    http_response_code(403);
    die("Acesso Negado: Token invalido.");
}

$encodedUrl = $_GET['url'] ?? '';
if (!$encodedUrl) {
    http_response_code(404);
    die("Vídeo não encontrado.");
}

$realVideoUrl = base64_decode(urldecode($encodedUrl));

// Validação basica de URL
if (!filter_var($realVideoUrl, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    die("URL inválida.");
}

// Redirect the video directly. 
// For a TRUE proxy (hiding the URL completely from Network tab at the cost of your server's bandwidth):
// readfile($realVideoUrl); is an option, but for large videos on shared hosting, it might buffer heavily.
// For the MVP, a header redirect is usually enough to obfuscate it from the casual HTML source viewer,
// although the readfile() approach is what we used in Express.

// Let's implement the TRUE proxy approach (Pass-through bandwidth)
header("Content-Type: video/mp4");
header("Cache-Control: no-cache");

// Disable output buffering to stream immediately
if (ob_get_level()) {
    ob_end_clean();
}

readfile($realVideoUrl);
exit;
?>
