<?php
// /api/admin/embed.php
// Retorna o código de incorporação (iframe) para um vídeo específico
require_once __DIR__ . '/../auth.php';

$user = checkAuth('admin');
global $pdo;

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(['error' => 'Método não permitido'], 405);
}

$video_id = $_GET['video_id'] ?? null;
$student_id = $_GET['student_id'] ?? '[ID_DO_ALUNO]';
$width = $_GET['width'] ?? '100%';
$height = $_GET['height'] ?? '600';

if (!$video_id) {
    sendJson(['error' => 'video_id é obrigatório'], 400);
}

// Busca o vídeo e verifica se pertence à instituição
$stmt = $pdo->prepare("SELECT v.*, i.nome as instituicao_nome FROM videos v JOIN instituicoes i ON v.instituicao_id = i.id WHERE v.id = ? AND v.instituicao_id = ?");
$stmt->execute([$video_id, $user['instituicao_id']]);
$video = $stmt->fetch();

if (!$video) {
    sendJson(['error' => 'Vídeo não encontrado ou sem permissão'], 404);
}

// Monta a URL do player embed
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'];
$base_url = $protocol . '://' . $host;

$embed_url = "{$base_url}/embed/player.html"
    . "?v={$video['id']}"
    . "&i={$video['instituicao_id']}"
    . "&c={$video['curso_id']}"
    . "&m={$video['modulo_id']}"
    . "&u=" . urlencode($student_id);

$iframe_code = '<iframe'
    . ' src="' . $embed_url . '"'
    . ' width="' . htmlspecialchars($width) . '"'
    . ' height="' . htmlspecialchars($height) . '"'
    . ' frameborder="0"'
    . ' allowfullscreen'
    . ' allow="autoplay; encrypted-media"'
    . '></iframe>';

sendJson([
    'video_id'    => (int)$video['id'],
    'video_title' => $video['title'],
    'embed_url'   => $embed_url,
    'iframe_code' => $iframe_code,
    'params'      => [
        'v' => (int)$video['id'],
        'i' => (int)$video['instituicao_id'],
        'c' => (int)$video['curso_id'],
        'm' => (int)$video['modulo_id'],
        'u' => $student_id,
    ],
    'nota' => 'Substitua [ID_DO_ALUNO] pelo identificador único do usuário na sua plataforma (e-mail, matrícula, etc.)',
]);
?>
