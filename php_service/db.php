<?php
// Configurações do Banco de Dados MySQL
$host = 'srv1603.hstgr.io';
$dbname = 'u366538509_bancoplayer';
$username = 'u366538509_bancoplayer1'; // Altere para seu usuário
$password = 'AMist01@92'; // Altere para sua senha

// Criando conexão com MySQLi
$conn = new mysqli($host, $username, $password, $dbname);

// Checando a conexão
if ($conn->connect_error) {
    die(json_encode([
        'error' => 'Falha na conexão com o banco de dados',
        'details' => $conn->connect_error
    ]));
}

// Configurar charset para suportar caracteres especiais e acentos
$conn->set_charset("utf8mb4");
?>
