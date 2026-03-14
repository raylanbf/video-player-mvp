<?php
// /api/admin/videos.php
require_once __DIR__ . '/../auth.php';

$user = checkAuth('admin'); 
$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            // Return single video for editing
            $stmt = $pdo->prepare("SELECT v.*, c.nome as curso_nome, m.nome as modulo_nome FROM videos v LEFT JOIN cursos c ON v.curso_id = c.id LEFT JOIN modulos m ON v.modulo_id = m.id WHERE v.id = ? AND v.instituicao_id = ?");
            $stmt->execute([$id, $user['instituicao_id']]);
            $video = $stmt->fetch();
            if (!$video) sendJson(['error' => 'Video not found'], 404);
            sendJson($video);
        } else {
            // Return all videos with curso and modulo names
            $stmt = $pdo->prepare("SELECT v.*, c.nome as curso_nome, m.nome as modulo_nome FROM videos v LEFT JOIN cursos c ON v.curso_id = c.id LEFT JOIN modulos m ON v.modulo_id = m.id WHERE v.instituicao_id = ? ORDER BY c.nome, m.nome, v.title");
            $stmt->execute([$user['instituicao_id']]);
            sendJson($stmt->fetchAll());
        }
        break;


    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Block user if limit reached
        $stmtLimit = $pdo->prepare("SELECT limite_videos, (SELECT COUNT(*) FROM videos WHERE instituicao_id = ?) as total_videos FROM instituicoes WHERE id = ?");
        $stmtLimit->execute([$user['instituicao_id'], $user['instituicao_id']]);
        $limits = $stmtLimit->fetch();
        
        if ($limits['total_videos'] >= $limits['limite_videos']) {
            sendJson(['error' => 'Limite de vídeos atingido para sua instituição (' . $limits['limite_videos'] . ')'], 403);
        }

        $stmt = $pdo->prepare("INSERT INTO videos (title, description, video_url, duration, instituicao_id, curso_id, modulo_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['title'], 
            $input['description'] ?? '', 
            $input['video_url'], 
            $input['duration'] ?? 0, 
            $user['instituicao_id'],
            $input['curso_id'],
            $input['modulo_id']
        ]);
        sendJson(['id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("UPDATE videos SET title=?, description=?, video_url=?, duration=?, curso_id=?, modulo_id=? WHERE id=? AND instituicao_id=?");
        $stmt->execute([
            $input['title'], 
            $input['description'], 
            $input['video_url'], 
            $input['duration'], 
            $input['curso_id'],
            $input['modulo_id'],
            $id, 
            $user['instituicao_id']
        ]);
        sendJson(['updated' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("DELETE FROM videos WHERE id=? AND instituicao_id=?");
        $stmt->execute([$id, $user['instituicao_id']]);
        sendJson(['deleted' => true]);
        break;

    default:
        sendJson(['error' => 'Método não permitido'], 405);
}
?>
