const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  // Users table (for fake admin and students)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`);

  // Videos table
  db.run(`CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    video_url TEXT,
    duration INTEGER,
    status TEXT DEFAULT 'ativo'
  )`);

  // Questions table
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER,
    minuto_disparo REAL,
    enunciado TEXT,
    alternativa_a TEXT,
    alternativa_b TEXT,
    alternativa_c TEXT,
    alternativa_d TEXT,
    alternativa_correta TEXT,
    feedback_correto TEXT,
    feedback_errado TEXT,
    ativo TEXT DEFAULT 'ativo',
    FOREIGN KEY(video_id) REFERENCES videos(id)
  )`);

  // Progress table
  db.run(`CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    video_id INTEGER,
    current_time REAL DEFAULT 0,
    ultima_pergunta_respondida INTEGER DEFAULT 0,
    concluido BOOLEAN DEFAULT 0,
    UNIQUE(user_id, video_id)
  )`);

  // Answers table
  db.run(`CREATE TABLE IF NOT EXISTS answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER,
    question_id INTEGER,
    user_id TEXT,
    resposta_marcada TEXT,
    acertou BOOLEAN,
    respondido_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed Data
  db.get(`SELECT COUNT(*) as count FROM users WHERE username = 'admin'`, (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);
    }
  });

  db.get(`SELECT COUNT(*) as count FROM videos WHERE id = 1`, (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO videos (title, description, video_url, duration, status) 
              VALUES ('Vídeo de Exemplo', 'Vídeo demonstrativo para o MVP', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 10, 'ativo')`);
      
      // Seed questions for video 1
      const questions = [
        [1, 2, 'O que aconteceu no início do vídeo?', 'Um pássaro cantou', 'Um coelho acordou', 'Uma maçã caiu', 'Nada', 'b', 'Isso mesmo, o coelho grande acordou!', 'Incorreto. Assista novamente com atenção.'],
        [1, 4, 'Qual a cor principal do cenário?', 'Verde', 'Azul', 'Vermelho', 'Preto', 'a', 'Certo, a cena se passa em uma floresta verde.', 'Incorreto, observe as folhas e a grama.'],
        [1, 6, 'Qual a atitude dos pequenos animais?', 'Eles são amigáveis', 'Eles estão dormindo', 'Eles incomodam o coelho maior', 'Eles voam', 'c', 'Correto, eles ficam provocando o coelho!', 'Incorreto, eles são travessos.'],
        [1, 8, 'Como o coelho grande reage?', 'Ele foge', 'Ele tenta se defender e planeja algo', 'Ele chora', 'Ele ri', 'b', 'Muito bem! Ele tenta resolver o problema.', 'Incorreto. Ele toma uma atitude!']
      ];

      const stmt = db.prepare(`INSERT INTO questions (video_id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      questions.forEach(q => stmt.run(q));
      stmt.finalize();
    }
  });

  console.log('Database initialized successfully with seed data.');
});
