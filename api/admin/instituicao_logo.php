<?php
// /api/admin/instituicao_logo.php
require_once __DIR__ . '/../auth.php';

$user = checkAuth('admin'); 
$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['logo_url'])) sendJson(['error' => 'URL da logo obrigatória'], 400);

    $stmt = $pdo->prepare("UPDATE instituicoes SET logo_url=? WHERE id=?");
    $stmt->execute([$input['logo_url'], $user['instituicao_id']]);
    
    sendJson(['success' => true]);
} else {
    sendJson(['error' => 'Método não permitido'], 405);
}
?>
