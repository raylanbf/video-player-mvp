<?php
// /api/student/progress.php
require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

if ($method === 'GET') {
    $userId = $_GET['userId'] ?? null;
    $videoId = $_GET['videoId'] ?? null;

    if (!$userId || !$videoId)
        sendJson(['error' => 'Missing params'], 400);

    $stmt = $pdo->prepare("SELECT current_time, concluido FROM progress WHERE user_id = ? AND video_id = ?");
    $stmt->execute([$userId, $videoId]);
    $progress = $stmt->fetch();

    sendJson($progress ?: ['current_time' => 0, 'concluido' => 0]);

} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $userId = $input['user_id'] ?? null;
    $videoId = $input['video_id'] ?? null;
    $currentTime = $input['current_time'] ?? 0;
    $isCompleted = isset($input['concluido']) && $input['concluido'] ? 1 : 0; // FIXED variable name

    if (!$userId || !$videoId)
        sendJson(['error' => 'Missing params'], 400);

    // UPSERT (Insert or Update if exists based on UNIQUE constraint in schema)
    $stmt = $pdo->prepare("
        INSERT INTO progress (user_id, video_id, current_time, concluido) 
        VALUES (?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE current_time = ?, concluido = ?
    ");
    $stmt->execute([$userId, $videoId, $currentTime, $isCompleted, $currentTime, $isCompleted]);

    sendJson(['success' => true]);
} else {
    sendJson(['error' => 'Método não permitido'], 405);
}
?>