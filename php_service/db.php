<?php
// Configurações do Banco de Dados MySQL
$host = 'localhost';
$dbname = 'videoplayer_mvp';
$username = 'root'; // Altere para seu usuário
$password = '';     // Altere para sua senha

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
