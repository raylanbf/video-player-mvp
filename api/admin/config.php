<?php
// /api/admin/config.php
require_once __DIR__ . '/../auth.php';

// Protect Route
$user = checkAuth('admin'); 

$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    $logo = $input['logo_url'] ?? '';

    $stmt = $pdo->prepare("UPDATE instituicoes SET logo_url = ? WHERE id = ?");
    $stmt->execute([$logo, $user['instituicao_id']]);
    
    sendJson(['success' => true]);
} else {
    sendJson(['error' => 'Método não permitido'], 405);
}
?>
