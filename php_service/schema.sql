-- Schema de Banco de Dados MySQL para o Microserviço de Perguntas

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instituicao_id INT NOT NULL,
    curso_id INT NOT NULL,
    video_id INT NOT NULL,
    enunciado TEXT NOT NULL,
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    alternativa_correta CHAR(1) NOT NULL, -- 'a', 'b', 'c', 'd'
    feedback_correto TEXT,
    feedback_errado TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS answers_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    instituicao_id INT NOT NULL,
    curso_id INT NOT NULL,
    question_id INT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    resposta_marcada CHAR(1) NOT NULL,
    acertou TINYINT(1) NOT NULL,
    respondido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(question_id) REFERENCES questions(id)
);

-- Dados de exemplo
INSERT INTO questions (instituicao_id, curso_id, video_id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado)
VALUES 
(1, 101, 50, 'Qual a função de um microserviço?', 'Monolito gigante', 'Serviço isolado e independente', 'Banco de dados', 'Frontend', 'b', 'Correto! É um serviço independente.', 'Errado, tente novamente.');
