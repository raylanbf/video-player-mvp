<?php
// /api/db.php
// Configuração do Banco de Dados para Hostinger / cPanel

$host = 'localhost'; // Usually localhost on shared hosting
$db   = 'seu_banco_de_dados';
$user = 'seu_usuario';
$pass = 'sua_senha';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Return a generic JSON error so the frontend doesn't break parsing HTML
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}

// Helper para enviar JSON e finalizar a requisição
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
