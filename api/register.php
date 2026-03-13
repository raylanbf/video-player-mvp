<?php
require_once __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    if (!$username || !$password) {
        sendJson(['success' => false, 'message' => 'Preencha todos os campos'], 400);
    }
    
    global $pdo;
    
    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        sendJson(['success' => false, 'message' => 'Usuário já existe'], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'superadmin')");
    $stmt->execute([$username, $password]);
    
    sendJson(['success' => true, 'message' => 'Conta criada com sucesso! Faça Login.']);
}
?>
