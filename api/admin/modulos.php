<?php
// /api/admin/modulos.php
require_once __DIR__ . '/../auth.php';

$user = checkAuth('admin'); 
$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

switch ($method) {
    case 'GET':
        $query = "SELECT m.*, c.nome as curso_nome FROM modulos m JOIN cursos c ON m.curso_id = c.id WHERE m.instituicao_id = ?";
        $params = [$user['instituicao_id']];
        
        if (isset($_GET['curso_id'])) {
            $query .= " AND m.curso_id = ?";
            $params[] = $_GET['curso_id'];
        }

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        sendJson($stmt->fetchAll());
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if(!isset($input['nome']) || !isset($input['curso_id'])) sendJson(['error' => 'Campos obrigatórios'], 400);

        $stmt = $pdo->prepare("INSERT INTO modulos (nome, curso_id, instituicao_id, status) VALUES (?, ?, ?, ?)");
        $stmt->execute([$input['nome'], $input['curso_id'], $user['instituicao_id'], $input['status'] ?? 'ativo']);
        sendJson(['id' => $pdo->lastInsertId()]);
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("UPDATE modulos SET nome=?, curso_id=?, status=? WHERE id=? AND instituicao_id=?");
        $stmt->execute([$input['nome'], $input['curso_id'], $input['status'], $id, $user['instituicao_id']]);
        sendJson(['updated' => true]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if(!$id) sendJson(['error' => 'ID missing'], 400);

        $stmt = $pdo->prepare("DELETE FROM modulos WHERE id=? AND instituicao_id=?");
        $stmt->execute([$id, $user['instituicao_id']]);
        sendJson(['deleted' => true]);
        break;

    default:
        sendJson(['error' => 'Método não permitido'], 405);
}
?>
