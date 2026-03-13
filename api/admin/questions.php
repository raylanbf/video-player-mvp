<?php
// /api/admin/questions.php
require_once __DIR__ . '/../auth.php';

$user = checkAuth('admin'); 
$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

switch ($method) {
    case 'GET':
        $videoId = $_GET['videoId'] ?? null;
        if(!$videoId) sendJson(['error' => 'Video ID missing'], 400);

        $stmt = $pdo->prepare("SELECT * FROM questions WHERE video_id = ? AND instituicao_id = ? ORDER BY minuto_disparo ASC");
        $stmt->execute([$videoId, $user['instituicao_id']]);
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Block user if limit reached
        $stmtLimit = $pdo->prepare("SELECT limite_perguntas, (SELECT COUNT(*) FROM questions WHERE instituicao_id = ?) as total_perguntas FROM instituicoes WHERE id = ?");
        $stmtLimit->execute([$user['instituicao_id'], $user['instituicao_id']]);
        $limits = $stmtLimit->fetch();
        
        if ($limits['total_perguntas'] >= $limits['limite_perguntas']) {
            sendJson(['error' => 'Limite de perguntas atingido para sua instituição (' . $limits['limite_perguntas'] . ')'], 403);
        }

        $stmt = $pdo->prepare("
            INSERT INTO questions (video_id, instituicao_id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $input['video_id'],
            $user['instituicao_id'],
            $input['minuto_disparo'],
            $input['enunciado'],
            $input['alternativa_a'],
            $input['alternativa_b'],
            $input['alternativa_c'] ?? '',
            $input['alternativa_d'] ?? '',
            $input['alternativa_correta'],
            $input['feedback_correto'] ?? '',
            $input['feedback_errado'] ?? ''
        ]);
        sendJson(['id' => $pdo->lastInsertId()]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("DELETE FROM questions WHERE id=? AND instituicao_id=?");
        $stmt->execute([$id, $user['instituicao_id']]);
        sendJson(['deleted' => true]);
        break;

    default:
        sendJson(['error' => 'Método não permitido'], 405);
}
?>
