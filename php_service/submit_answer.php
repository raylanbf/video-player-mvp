<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Lidar com requisição preflight de CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require 'db.php';

// Pegar JSON do corpo da requisição
$data = json_decode(file_get_contents('php://input'), true);

$instituicao_id = isset($data['instituicao_id']) ? (int)$data['instituicao_id'] : 0;
$curso_id = isset($data['curso_id']) ? (int)$data['curso_id'] : 0;
$question_id = isset($data['question_id']) ? (int)$data['question_id'] : 0;
$resposta = isset($data['resposta']) ? strtolower($data['resposta']) : '';
$user_id = isset($data['user_id']) ? $data['user_id'] : 'unknown_user';

if (!$instituicao_id || !$curso_id || !$question_id || !$resposta) {
    echo json_encode(['error' => 'Parâmetros obrigatórios ausentes: instituicao_id, curso_id, question_id, resposta']);
    exit;
}

// 1. Verificar qual é a resposta correta
$stmt = $conn->prepare("SELECT alternativa_correta, feedback_correto, feedback_errado FROM questions WHERE instituicao_id = ? AND curso_id = ? AND id = ? LIMIT 1");

if ($stmt === false) {
    echo json_encode(['error' => 'Erro na preparação da query de busca']);
    exit;
}

$stmt->bind_param("iii", $instituicao_id, $curso_id, $question_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    // 2. Checar se acertou
    $acertou = ($row['alternativa_correta'] === $resposta) ? 1 : 0;
    
    // 3. Registrar o resultado no banco de dados (Tabela answers_log)
    $insert_stmt = $conn->prepare("INSERT INTO answers_log (instituicao_id, curso_id, question_id, user_id, resposta_marcada, acertou) VALUES (?, ?, ?, ?, ?, ?)");
    
    if($insert_stmt) {
        $insert_stmt->bind_param("iiissi", $instituicao_id, $curso_id, $question_id, $user_id, $resposta, $acertou);
        $insert_stmt->execute();
        $insert_stmt->close();
    }
    
    // 4. Retornar pacote para o frontend exibir no player
    echo json_encode([
        'success' => true,
        'acertou' => (bool)$acertou,
        'feedback' => $acertou ? $row['feedback_correto'] : $row['feedback_errado']
    ]);
    
} else {
    echo json_encode(['success' => false, 'error' => 'Pergunta não encontrada.']);
}

$stmt->close();
$conn->close();
?>
