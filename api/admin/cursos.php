<?php
// /api/admin/cursos.php
require_once __DIR__ . '/../auth.php';

$user = checkAuth('admin'); 
$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

switch ($method) {
    case 'GET':
        $stmt = $pdo->prepare("SELECT * FROM cursos WHERE instituicao_id = ?");
        $stmt->execute([$user['instituicao_id']]);
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if(!isset($input['nome'])) sendJson(['error' => 'Nome obrigatório'], 400);

        $stmt = $pdo->prepare("INSERT INTO cursos (nome, instituicao_id, status) VALUES (?, ?, ?)");
        $stmt->execute([$input['nome'], $user['instituicao_id'], $input['status'] ?? 'ativo']);
        sendJson(['id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("UPDATE cursos SET nome=?, status=? WHERE id=? AND instituicao_id=?");
        $stmt->execute([$input['nome'], $input['status'], $id, $user['instituicao_id']]);
        sendJson(['updated' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("DELETE FROM cursos WHERE id=? AND instituicao_id=?");
        $stmt->execute([$id, $user['instituicao_id']]);
        sendJson(['deleted' => true]);
        break;

    default:
        sendJson(['error' => 'Método não permitido'], 405);
}
?>
