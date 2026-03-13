-- Schema Consolidado para o MVP do Video Player em MySQL
-- Preparado para Hostinger / cPanel

CREATE TABLE IF NOT EXISTS instituicoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    limite_videos INT DEFAULT 10,
    limite_perguntas INT DEFAULT 50,
    logo_url VARCHAR(500),
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    instituicao_id INT NOT NULL,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cursos_instituicao
        FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS modulos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    curso_id INT NOT NULL,
    instituicao_id INT NOT NULL,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_modulos_curso
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_modulos_instituicao
        FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'admin') NOT NULL,
    instituicao_id INT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_instituicao
        FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    duration INT NOT NULL,
    status ENUM('ativo', 'inativo') DEFAULT 'ativo',
    instituicao_id INT NOT NULL,
    curso_id INT NOT NULL,
    modulo_id INT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_videos_instituicao
        FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_videos_curso
        FOREIGN KEY (curso_id) REFERENCES cursos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_videos_modulo
        FOREIGN KEY (modulo_id) REFERENCES modulos(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id INT NOT NULL,
    instituicao_id INT NOT NULL,
    minuto_disparo DECIMAL(10,2) NOT NULL,
    enunciado TEXT NOT NULL,
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_correta CHAR(1) NOT NULL,
    feedback_correto TEXT,
    feedback_errado TEXT,
    ativo ENUM('ativo', 'inativo') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_video
        FOREIGN KEY (video_id) REFERENCES videos(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_questions_instituicao
        FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    video_id INT NOT NULL,
    tempo_atual DECIMAL(10,2) DEFAULT 0.00,
    ultima_pergunta_respondida INT DEFAULT 0,
    concluido TINYINT(1) DEFAULT 0,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_video (user_id, video_id),
    CONSTRAINT fk_progress_video
        FOREIGN KEY (video_id) REFERENCES videos(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS answers_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instituicao_id INT NULL,
    curso_id INT NULL,
    modulo_id INT NULL,
    question_id INT NOT NULL,
    video_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    resposta_marcada CHAR(1) NOT NULL,
    acertou TINYINT(1) NOT NULL,
    respondido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_answers_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_answers_video
        FOREIGN KEY (video_id) REFERENCES videos(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==========================================
-- DADOS INICIAIS / SEED
-- ==========================================

INSERT IGNORE INTO instituicoes (id, nome, limite_videos, limite_perguntas, status)
VALUES (1, 'Instituição Seed PHP', 10, 50, 'ativo');

INSERT IGNORE INTO cursos (id, nome, instituicao_id, status)
VALUES (1, 'Curso de PHP', 1, 'ativo');

INSERT IGNORE INTO modulos (id, nome, curso_id, instituicao_id, status)
VALUES (1, 'Módulo 1 - Setup', 1, 1, 'ativo');

-- Senhas em texto puro apenas para MVP
-- No ambiente real use password_hash() no PHP
INSERT IGNORE INTO users (id, username, password, role, instituicao_id)
VALUES
(1, 'superadmin', 'super123', 'superadmin', NULL),
(2, 'admin', 'admin123', 'admin', 1);

INSERT IGNORE INTO videos (
    id, title, description, video_url, duration, status, instituicao_id, curso_id, modulo_id
) VALUES (
    1,
    'Vídeo de Exemplo Hostinger',
    'Demonstração no MySQL',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    10,
    'ativo',
    1,
    1,
    1
);

INSERT IGNORE INTO questions (
    id,
    video_id,
    instituicao_id,
    minuto_disparo,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_correta,
    feedback_correto,
    feedback_errado,
    ativo
) VALUES
(
    1,
    1,
    1,
    0.10,
    'O que aconteceu no início do vídeo?',
    'Um pássaro cantou',
    'Um coelho acordou',
    'Uma maçã caiu',
    'Nada',
    'b',
    'Isso mesmo, o coelho grande acordou!',
    'Incorreto. Assista novamente com atenção.',
    'ativo'
),
(
    2,
    1,
    1,
    0.20,
    'Qual a cor principal do cenário?',
    'Verde',
    'Azul',
    'Vermelho',
    'Preto',
    'a',
    'Certo, a cena se passa em uma floresta verde.',
    'Incorreto, observe as folhas e a grama.',
    'ativo'
);