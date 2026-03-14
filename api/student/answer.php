<?php
// /api/student/answer.php
require_once __DIR__ . '/../db.php';

$method = $_SERVER['REQUEST_METHOD'];
global $pdo;

if ($method === 'GET') {
    // Fetch answered correct questions for this user/video to prevent re-asking
    $userId = $_GET['userId'] ?? null;
    $videoId = $_GET['videoId'] ?? null;

    if (!$userId || !$videoId)
        sendJson(['error' => 'Missing params'], 400);

    $stmt = $pdo->prepare("SELECT question_id, acertou as is_correct FROM answers_log WHERE user_id = ? AND video_id = ?");
    $stmt->execute([$userId, $videoId]);
    sendJson($stmt->fetchAll());

} elseif ($method === 'POST') {
    // Save a new answer attempt
    $input = json_decode(file_get_contents('php://input'), true);

    $instituicaoId = $input['instituicao_id'] ?? null;
    $cursoId = $input['curso_id'] ?? null;
    $moduloId = $input['modulo_id'] ?? null;
    $questionId = $input['question_id'] ?? null;
    $videoId = $input['video_id'] ?? null;
    $userId = $input['user_id'] ?? null;
    $selectedOption = $input['resposta_marcada'] ?? null; // FIXED variable name from Frontend

    if (!$questionId || !$videoId || !$userId || !$selectedOption) {
        sendJson(['error' => 'Missing parameters for answer logic'], 400);
    }

    // BUSCA A PERGUNTA PARA VALIDAR SE ACERTOU
    $stmtQ = $pdo->prepare("SELECT alternativa_correta, feedback_correto, feedback_errado FROM questions WHERE id = ?");
    $stmtQ->execute([$questionId]);
    $questionData = $stmtQ->fetch();

    if (!$questionData) {
        sendJson(['error' => 'Question not found'], 404);
    }

    $isCorrect = (strtolower($selectedOption) === strtolower($questionData['alternativa_correta'])) ? 1 : 0;

    $stmt = $pdo->prepare("
        INSERT INTO answers_log (instituicao_id, curso_id, modulo_id, question_id, video_id, user_id, resposta_marcada, acertou) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$instituicaoId, $cursoId, $moduloId, $questionId, $videoId, $userId, $selectedOption, $isCorrect]);

    // RETORNA O FEEDBACK AO FRONTEND
    sendJson([
        'success' => true,
        'acertou' => (bool) $isCorrect,
        'feedback_correto' => $questionData['feedback_correto'],
        'feedback_errado' => $questionData['feedback_errado']
    ]);
} else {
    sendJson(['error' => 'Método não permitido'], 405);
}
?>