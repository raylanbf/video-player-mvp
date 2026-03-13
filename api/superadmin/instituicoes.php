<?php
// /api/superadmin/instituicoes.php
require_once __DIR__ . '/../auth.php';

// Protect Route
$user = checkAuth('superadmin'); // Demands 'superadmin' role

$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

switch ($method) {
    case 'GET':
        // List institutions with counts
        $stmt = $pdo->query("
            SELECT i.*, 
            (SELECT COUNT(*) FROM videos WHERE instituicao_id = i.id) as videos_cadastrados,
            (SELECT COUNT(*) FROM questions WHERE instituicao_id = i.id) as perguntas_cadastradas
            FROM instituicoes i
        ");
        $instituicoes = $stmt->fetchAll();
        sendJson($instituicoes);
        break;

    case 'POST':
        // Create new institution
        $input = json_decode(file_get_contents('php://input'), true);
        
        $nome = $input['nome'] ?? '';
        $limite_v = $input['limite_videos'] ?? 10;
        $limite_p = $input['limite_perguntas'] ?? 50;
        $logo = $input['logo_url'] ?? '';

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO instituicoes (nome, limite_videos, limite_perguntas, logo_url) VALUES (?, ?, ?, ?)");
            $stmt->execute([$nome, $limite_v, $limite_p, $logo]);
            $instId = $pdo->lastInsertId();

            // Create default admin user for this institution
            $defaultUser = 'admin_' . $instId;
            $pass = '123456';
            
            $stmtUser = $pdo->prepare("INSERT INTO users (username, password, role, instituicao_id) VALUES (?, ?, 'admin', ?)");
            $stmtUser->execute([$defaultUser, $pass, $instId]);
            
            $pdo->commit();
            sendJson(['success' => true, 'instituicao_id' => $instId, 'admin_user' => $defaultUser, 'admin_pass' => $pass]);
            
        } catch (\Exception $e) {
            $pdo->rollBack();
            sendJson(['error' => 'Erro ao criar instituição: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        // Update institution
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("UPDATE instituicoes SET nome=?, limite_videos=?, limite_perguntas=?, status=? WHERE id=?");
        $stmt->execute([$input['nome'], $input['limite_videos'], $input['limite_perguntas'], $input['status'], $id]);
        
        sendJson(['updated' => true]);
        break;

    case 'DELETE':
        // Delete institution
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        // Delete cascade automatically handles linked users, videos, questions, etc because of Schema layout
        $stmt = $pdo->prepare("DELETE FROM instituicoes WHERE id=?");
        $stmt->execute([$id]);
        
        sendJson(['deleted' => true]);
        break;

    default:
        sendJson(['error' => 'Método não permitido'], 405);
}
?>
