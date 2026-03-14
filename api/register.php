<?php
require_once __DIR__ . '/db.php';

// CORS handled by .htaccess

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    $role = $input['role'] ?? 'admin'; // Padrão admin se não enviado
    
    if (!$username || !$password) {
        sendJson(['success' => false, 'message' => 'Preencha todos os campos'], 400);
    }
    
    if (!in_array($role, ['admin', 'superadmin'])) {
        sendJson(['success' => false, 'message' => 'Tipo de conta inválido'], 400);
    }
    
    global $pdo;
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        sendJson(['success' => false, 'message' => 'Usuário já existe'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
    $stmt->execute([$username, $password, $role]);
    
    sendJson(['success' => true, 'message' => 'Conta criada com sucesso! Faça Login.']);
}
?>
