<?php
// /api/auth.php
// Autenticação via sessão PHP (sem JWT, sem Authorization header)

// Sessão ANTES de qualquer output ou include com output
if (session_status() === PHP_SESSION_NONE) {
    // Configurações de cookie de sessão seguras e compatíveis
    session_set_cookie_params([
        'lifetime' => 86400 * 7, // 7 dias
        'path'     => '/',
        'secure'   => false,     // true em produção com HTTPS
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

require_once __DIR__ . '/db.php';

/**
 * Verifica se o usuário está autenticado via sessão.
 * Se não estiver, retorna 401 e encerra.
 * $requiredRole: 'admin', 'superadmin' ou null (qualquer role serve)
 */
function checkAuth($requiredRole = null) {
    if (!isset($_SESSION['user'])) {
        sendJson(['error' => 'Não autenticado. Faça login primeiro.'], 401);
    }

    $user = $_SESSION['user'];

    if ($requiredRole && $user['role'] !== 'superadmin' && $user['role'] !== $requiredRole) {
        sendJson(['error' => 'Acesso negado: Perfil insuficiente'], 403);
    }

    return $user; // Retorna array com id, role, instituicao_id
}

// ==========================================
// Roteador: POST = Login | DELETE = Logout | GET = Status
// (executado apenas quando auth.php é o script diretamente chamado)
// ==========================================

if (basename($_SERVER['SCRIPT_FILENAME']) === 'auth.php') {
    $method = $_SERVER['REQUEST_METHOD'];

    // CORS dinâmico (necessário para credentials:include funcionar - wildcard * não é aceito)
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    }

    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if ($method === 'POST') {
        // ---- LOGIN ----
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);

        if (!$input) {
            sendJson(['success' => false, 'message' => 'Body JSON inválido ou vazio'], 400);
        }

        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');

        if (!$username || !$password) {
            sendJson(['success' => false, 'message' => 'Username e senha são obrigatórios'], 400);
        }

        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
        $stmt->execute([$username, $password]);
        $user = $stmt->fetch();

        if ($user) {
            // Regenera ID de sessão para segurança
            session_regenerate_id(true);

            $_SESSION['user'] = [
                'id'            => (int)$user['id'],
                'role'          => $user['role'],
                'instituicao_id'=> (int)$user['instituicao_id'],
                'username'      => $user['username'],
            ];

            sendJson([
                'success' => true,
                'role'    => $user['role'],
                'user'    => $_SESSION['user']
            ]);
        } else {
            sendJson(['success' => false, 'message' => 'Credenciais inválidas'], 401);
        }

    } elseif ($method === 'DELETE') {
        // ---- LOGOUT ----
        $_SESSION = [];
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        sendJson(['success' => true, 'message' => 'Logout realizado']);

    } elseif ($method === 'GET') {
        // ---- STATUS / VERIFICAR SESSÃO ----
        if (isset($_SESSION['user'])) {
            sendJson(['authenticated' => true, 'user' => $_SESSION['user']]);
        } else {
            sendJson(['authenticated' => false], 401);
        }

    } else {
        sendJson(['error' => 'Método não permitido'], 405);
    }
}
?>
