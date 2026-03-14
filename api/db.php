<?php
// /api/db.php
// Configuração do Banco de Dados para Hostinger / cPanel

$isLocal = in_array($_SERVER['SERVER_NAME'], ['localhost', '127.0.0.1']) || strpos($_SERVER['HTTP_HOST'], 'localhost') !== false;

if ($isLocal) {
    // Configuração Local (XAMPP/WAMP/Laragon)
    $host = 'localhost';
    $db   = 'video_player_mvp'; // Altere se o nome do seu banco local for diferente
    $user = 'root';
    $pass = ''; // Senha geralmente é vazia localmente
} else {
    // Configuração Hostinger / Produção
    $host = 'srv1603.hstgr.io';
    $db   = 'u366538509_bancoplayer';
    $user = 'u366538509_bancoplayer1';
    $pass = 'AMist01@92';
}
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    
    // Teste de conexão via Navegador
    if (isset($_GET['test'])) {
        sendJson(['success' => true, 'message' => 'Conexão com o Banco de Dados realizada com SUCESSO!']);
    }
} catch (\PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
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
