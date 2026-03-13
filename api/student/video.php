<?php
// /api/student/video.php
require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

if ($method === 'GET') {
    $id = $_GET['id'] ?? null;
    if (!$id) sendJson(['error' => 'Video ID missing'], 400);

    // Fetch video details and the institution's logo
    $stmt = $pdo->prepare("
        SELECT v.*, i.logo_url 
        FROM videos v 
        JOIN instituicoes i ON v.instituicao_id = i.id 
        WHERE v.id = ? AND v.status = 'ativo'
    ");
    $stmt->execute([$id]);
    $video = $stmt->fetch();

    if (!$video) sendJson(['error' => 'Video not found'], 404);

    // Swap the real URL for the PHP proxy URL
    $video['video_url'] = '/api/student/stream.php?url=' . urlencode(base64_encode($video['video_url']));

    // Fetch questions
    $stmtQ = $pdo->prepare("SELECT id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado FROM questions WHERE video_id = ? AND ativo = 'ativo' ORDER BY minuto_disparo ASC");
    $stmtQ->execute([$id]);
    $questions = $stmtQ->fetchAll();

    sendJson(['video' => $video, 'questions' => $questions]);
} else {
    sendJson(['error' => 'Método não permitido'], 405);
}
?>
