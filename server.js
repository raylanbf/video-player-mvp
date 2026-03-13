const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const http = require('http');
const https = require('https');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = new sqlite3.Database('./database.sqlite');

// --- API ROUTES ---

// Admin / Super Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  // Now checks for both admin and superadmin
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (user) {
      // Create a fake token that exposes the role and institution for MVP purposes
      // In production use JWT!
      const fakeToken = Buffer.from(JSON.stringify({
        id: user.id,
        role: user.role,
        instituicao_id: user.instituicao_id
      })).toString('base64');
      
      res.json({ success: true, token: fakeToken, role: user.role });
    } else {
      res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
  });
});

// Middleware to extract Fake JWT
function extractUser(req) {
    const auth = req.headers.authorization;
    if(!auth) return null;
    try {
        const tokenStr = Buffer.from(auth.replace('Bearer ', ''), 'base64').toString('utf-8');
        return JSON.parse(tokenStr);
    } catch(e) { return null; }
}

// --- SUPER ADMIN ROUTES ---

// List Institutions
app.get('/api/superadmin/instituicoes', (req, res) => {
    const user = extractUser(req);
    if (!user || user.role !== 'superadmin') return res.status(403).send('Forbidden');
    
    // Get all institutions with counts
    db.all(`
        SELECT i.*, 
        (SELECT COUNT(*) FROM videos WHERE instituicao_id = i.id) as videos_cadastrados,
        (SELECT COUNT(*) FROM questions WHERE instituicao_id = i.id) as perguntas_cadastradas
        FROM instituicoes i
    `, (err, rows) => {
        if(err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create Institution
app.post('/api/superadmin/instituicoes', (req, res) => {
    const user = extractUser(req);
    if (!user || user.role !== 'superadmin') return res.status(403).send('Forbidden');
    
    const { nome, limite_videos, limite_perguntas, logo_url } = req.body;
    db.run('INSERT INTO instituicoes (nome, limite_videos, limite_perguntas, logo_url) VALUES (?, ?, ?, ?)',
        [nome, limite_videos, limite_perguntas, logo_url || ''], function(err) {
            if(err) return res.status(500).json({ error: err.message });
            
            // Auto-create a default admin for this institution
            const instId = this.lastID;
            const defaultUser = 'admin_' + instId;
            db.run('INSERT INTO users (username, password, role, instituicao_id) VALUES (?, ?, ?, ?)',
                [defaultUser, '123456', 'admin', instId], function(err2) {
                    res.json({ success: true, instituicao_id: instId, admin_user: defaultUser, admin_pass: '123456' });
            });
    });
});

// Update Logo Configuration (Institution Admin)
app.put('/api/instituicao/logo', (req, res) => {
    const user = extractUser(req);
    if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
    
    db.run('UPDATE instituicoes SET logo_url = ? WHERE id = ?', [req.body.logo_url, user.instituicao_id], function(err) {
        if(err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Admin: List Videos
app.get('/api/videos', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  db.all('SELECT * FROM videos WHERE instituicao_id = ?', [user.instituicao_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin: Get Video Form Details
app.get('/api/videos/:id', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  db.get('SELECT * FROM videos WHERE id = ? AND instituicao_id = ?', [req.params.id, user.instituicao_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// Admin: Create Video
app.post('/api/videos', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  // Check Limits
  db.get('SELECT limite_videos, (SELECT COUNT(*) FROM videos WHERE instituicao_id = ?) as current_count FROM instituicoes WHERE id = ?', 
    [user.instituicao_id, user.instituicao_id], (err, inst) => {
      
      if(inst.current_count >= inst.limite_videos) {
         return res.status(400).json({ error: 'Limite de vídeos da instituição atingido.' });
      }

      const { title, description, video_url, duration, status } = req.body;
      if (!title || !video_url) return res.status(400).json({ error: 'Título e URL são obrigatórios' });

      const stmt = db.prepare('INSERT INTO videos (title, description, video_url, duration, status, instituicao_id) VALUES (?, ?, ?, ?, ?, ?)');
      stmt.run([title, description, video_url, duration, status || 'ativo', user.instituicao_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID });
      });
      stmt.finalize();
  });
});

// Admin: Update Video
app.put('/api/videos/:id', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  const { title, description, video_url, duration, status } = req.body;
  const stmt = db.prepare('UPDATE videos SET title = ?, description = ?, video_url = ?, duration = ?, status = ? WHERE id = ? AND instituicao_id = ?');
  stmt.run([title, description, video_url, duration, status, req.params.id, user.instituicao_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
  stmt.finalize();
});

// Admin: Delete Video
app.delete('/api/videos/:id', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  db.run('DELETE FROM videos WHERE id = ? AND instituicao_id = ?', [req.params.id, user.instituicao_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Admin: List Questions for Video
app.get('/api/videos/:videoId/questions', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  db.all('SELECT * FROM questions WHERE video_id = ? AND instituicao_id = ? ORDER BY minuto_disparo ASC', [req.params.videoId, user.instituicao_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Admin: Create Question
app.post('/api/questions', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  // Check limit
  db.get('SELECT limite_perguntas, (SELECT COUNT(*) FROM questions WHERE instituicao_id = ?) as current_count FROM instituicoes WHERE id = ?', 
    [user.instituicao_id, user.instituicao_id], (err, inst) => {
        
        if(inst.current_count >= inst.limite_perguntas) {
             return res.status(400).json({ error: 'Limite de perguntas da instituição atingido.' });
        }

        const { video_id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado, ativo } = req.body;
        
        if (!video_id || minuto_disparo == null || !enunciado || !alternativa_correta) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        const stmt = db.prepare(`INSERT INTO questions 
            (video_id, instituicao_id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado, ativo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
        stmt.run([video_id, user.instituicao_id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado, ativo || 'ativo'], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
        stmt.finalize();
  });
});

// Admin: Update Question
app.put('/api/questions/:id', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  const { video_id, minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado, ativo } = req.body;
  
  const stmt = db.prepare(`UPDATE questions SET 
    minuto_disparo = ?, enunciado = ?, alternativa_a = ?, alternativa_b = ?, alternativa_c = ?, alternativa_d = ?, alternativa_correta = ?, feedback_correto = ?, feedback_errado = ?, ativo = ? 
    WHERE id = ? AND instituicao_id = ?`);
    
  stmt.run([minuto_disparo, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_correta, feedback_correto, feedback_errado, ativo, req.params.id, user.instituicao_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
  stmt.finalize();
});

// Admin: Delete Question
app.delete('/api/questions/:id', (req, res) => {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') return res.status(403).send('Forbidden');
  
  db.run('DELETE FROM questions WHERE id = ? AND instituicao_id = ?', [req.params.id, user.instituicao_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});


// --- STUDENT ROUTES ---

// Student: Get video and associated questions
app.get('/api/student/video/:id', (req, res) => {
  db.get('SELECT v.id, v.title, v.description, v.instituicao_id, i.logo_url FROM videos v LEFT JOIN instituicoes i ON v.instituicao_id = i.id WHERE v.id = ? AND v.status = "ativo"', [req.params.id], (err, video) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!video) return res.status(404).json({ error: 'Vídeo não encontrado ou inativo' });
    
    // Obscuring the real video_url by NOT sending it directly. 
    // Sending a proxy streaming URL instead.
    video.video_url = `/api/student/stream/${video.id}`;
    
    db.all('SELECT * FROM questions WHERE video_id = ? AND ativo = "ativo" ORDER BY minuto_disparo ASC', [req.params.id], (err, questions) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Filter answer data so student can't see the correct answer from API
      const safeQuestions = questions.map(q => ({
        id: q.id,
        minuto_disparo: q.minuto_disparo,
        enunciado: q.enunciado,
        alternativa_a: q.alternativa_a,
        alternativa_b: q.alternativa_b,
        alternativa_c: q.alternativa_c,
        alternativa_d: q.alternativa_d
      }));
      
      res.json({ video, questions: safeQuestions });
    });
  });
});

// Student: Secure Video Streaming Proxy
app.get('/api/student/stream/:id', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).send('Acesso Negado: Token de Segurança Ausente');

  // Verify the video exists and fetch the raw URL
  db.get('SELECT video_url FROM videos WHERE id = ? AND status = "ativo"', [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).send('Vídeo não encontrado');

    const videoUrl = row.video_url;
    const client = videoUrl.startsWith('https') ? https : http;

    const options = { headers: {} };
    // Forward the Range string to support fast-forwarding/seeking timeline
    if (req.headers.range) {
      options.headers.range = req.headers.range;
    }

    client.get(videoUrl, options, (streamRes) => {
      // Forward headers like Content-Range, Content-Length, Content-Type to the frontend
      res.writeHead(streamRes.statusCode, streamRes.headers);
      streamRes.pipe(res);
    }).on('error', (e) => {
      console.error('Streaming proxy error:', e);
      res.status(500).send('Erro ao buscar a stream de vídeo');
    });
  });
});

// Student: Get user progress
app.get('/api/student/progress/:userId/:videoId', (req, res) => {
  const { userId, videoId } = req.params;
  db.get('SELECT * FROM progress WHERE user_id = ? AND video_id = ?', [userId, videoId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) {
      return res.json({ current_time: 0, ultima_pergunta_respondida: 0, concluido: false });
    }
    
    // Get answered questions IDs
    db.all('SELECT question_id FROM answers WHERE user_id = ? AND video_id = ? AND acertou = 1', [userId, videoId], (err, answers) => {
      if (err) return res.status(500).json({ error: err.message });
      const answered_questions = answers.map(a => a.question_id);
      res.json({ ...row, answered_questions });
    });
  });
});

// Student: Save progress
app.post('/api/student/progress', (req, res) => {
  const { user_id, video_id, current_time, ultima_pergunta_respondida, concluido } = req.body;
  if (!user_id || !video_id) return res.status(400).json({ error: 'user_id e video_id obrigatórios' });

  db.get('SELECT id FROM progress WHERE user_id = ? AND video_id = ?', [user_id, video_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (row) {
      db.run('UPDATE progress SET current_time = ?, ultima_pergunta_respondida = ?, concluido = ? WHERE id = ?', 
        [current_time, ultima_pergunta_respondida || 0, concluido || 0, row.id], function(updateErr) {
          if (updateErr) return res.status(500).json({ error: updateErr.message });
          res.json({ success: true, updated: true });
      });
    } else {
      db.run('INSERT INTO progress (user_id, video_id, current_time, ultima_pergunta_respondida, concluido) VALUES (?, ?, ?, ?, ?)',
        [user_id, video_id, current_time, ultima_pergunta_respondida || 0, concluido || 0], function(insertErr) {
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          res.json({ success: true, inserted: true });
      });
    }
  });
});

// Student: Submit Answer
app.post('/api/student/answer', (req, res) => {
  const { user_id, video_id, question_id, resposta_marcada } = req.body;
  
  // Verify with DB directly 
  db.get('SELECT * FROM questions WHERE id = ?', [question_id], (err, q) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!q) return res.status(404).json({ error: 'Pergunta não encontrada' });
    
    const acertou = q.alternativa_correta === resposta_marcada;
    
    db.run('INSERT INTO answers (video_id, question_id, user_id, resposta_marcada, acertou) VALUES (?, ?, ?, ?, ?)',
      [video_id, question_id, user_id, resposta_marcada, acertou ? 1 : 0], function(insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        
        res.json({
          acertou,
          feedback_correto: q.feedback_correto,
          feedback_errado: q.feedback_errado
        });
    });
  });
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
