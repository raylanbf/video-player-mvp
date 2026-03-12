<?php
// Permitir chamadas CORS se o frontend rodar em porta diferente do PHP
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

require 'db.php';

// Pegando os parâmetros via GET
$instituicao_id = isset($_GET['instituicao_id']) ? (int)$_GET['instituicao_id'] : 0;
$curso_id = isset($_GET['curso_id']) ? (int)$_GET['curso_id'] : 0;
$question_id = isset($_GET['question_id']) ? (int)$_GET['question_id'] : 0;

if (!$instituicao_id || !$curso_id || !$question_id) {
    echo json_encode(['error' => 'Parâmetros obrigatórios ausentes: instituicao_id, curso_id, question_id']);
    exit;
}

// Preparar a query para buscar a pergunta específica
// Retornamos tudo exceto a resposta correta para não expor no frontend!
$stmt = $conn->prepare("
    SELECT id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d 
    FROM questions 
    WHERE instituicao_id = ? AND curso_id = ? AND id = ? 
    LIMIT 1
");

if ($stmt === false) {
    echo json_encode(['error' => 'Erro interno na query']);
    exit;
}

$stmt->bind_param("iii", $instituicao_id, $curso_id, $question_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(['success' => true, 'question' => $row]);
} else {
    echo json_encode(['success' => false, 'error' => 'Pergunta não encontrada para os parâmetros informados.']);
}

$stmt->close();
$conn->close();
?>
