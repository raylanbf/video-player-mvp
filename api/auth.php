<?php
// /api/auth.php
require_once __DIR__ . '/db.php';

// Função auxiliar para gerar um token JWT super simples (Apenas para MVP, use bibliotecas como Firebase JWT em prod)
function generateMVPToken($user) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode([
        'id' => $user['id'], 
        'role' => $user['role'], 
        'instituicao_id' => $user['instituicao_id'],
        'exp' => time() + (86400 * 7) // 7 days
    ]);
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    // SECRET KEY hardcoded to MVP, move to env file later
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'MVpSeCrEtKeY2026', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

// Função para validar o token que vem no header (Authorization: Bearer <token>)
function checkAuth($requiredRole = null) {
    $headers = apache_request_headers();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if(!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        sendJson(['error' => 'No Authorization token provided'], 401);
    }
    
    $token = $matches[1];
    $tokenParts = explode('.', $token);
    
    if(count($tokenParts) != 3) {
        sendJson(['error' => 'Invalid token format'], 401);
    }
    
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1])), true);
    
    if(!$payload || !isset($payload['role']) || $payload['exp'] < time()) {
        sendJson(['error' => 'Token expirado ou invalido'], 401);
    }
    
    if($requiredRole && $payload['role'] !== 'superadmin' && $payload['role'] !== $requiredRole) {
        sendJson(['error' => 'Acesso negado: Perfil insuficiente'], 403);
    }
    
    return $payload; // Retorna o user_id, role e instituicao_id
}

// CORS Headers para caso o frontend rode em domínio diferente no futuro
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle OPTIONS pre-flight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Roteador de Login - Simples POST para o arquivo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && basename($_SERVER['SCRIPT_FILENAME']) === 'auth.php') {
    
    $inputJSON = file_get_contents('php://input');
    $input = json_decode($inputJSON, TRUE);
    
    $username = $input['username'] ?? '';
    $password = $input['password'] ?? '';
    
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?"); // Nota: Senha em texto puro no MVP!
    $stmt->execute([$username, $password]);
    $user = $stmt->fetch();
    
    if ($user) {
        $token = generateMVPToken($user);
        sendJson(['success' => true, 'token' => $token, 'role' => $user['role']]);
    } else {
        sendJson(['success' => false, 'message' => 'Credenciais inválidas'], 401);
    }
}
?>
