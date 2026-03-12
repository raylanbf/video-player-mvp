const API_BASE = '/api';

// Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const videosListView = document.getElementById('videos-list-view');
const videoFormView = document.getElementById('video-form-view');
const questionsView = document.getElementById('questions-view');

let currentVideoId = null;

// Auth check
if (localStorage.getItem('adminToken')) {
    showDashboard();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('adminToken', data.token);
            showDashboard();
        } else {
            document.getElementById('login-error').innerText = data.message;
            document.getElementById('login-error').style.display = 'block';
        }
    } catch (err) {
        console.error(err);
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadVideos();
}

// ================= VIDEOS =================

async function loadVideos() {
    videosListView.classList.remove('hidden');
    videoFormView.classList.add('hidden');
    questionsView.classList.add('hidden');
    
    const res = await fetch(`${API_BASE}/videos`);
    const videos = await res.json();
    
    const tbody = document.getElementById('videos-tbody');
    tbody.innerHTML = '';
    
    videos.forEach(v => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.title}</td>
            <td>${v.duration}</td>
            <td>${v.status}</td>
            <td>
                <button onclick="editVideo(${v.id})" class="btn btn-small btn-secondary">Editar</button>
                <button onclick="manageQuestions(${v.id}, '${v.title.replace(/'/g, "\\'")}')" class="btn btn-small">Perguntas</button>
                <button onclick="deleteVideo(${v.id})" class="btn btn-small btn-danger">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('new-video-btn').addEventListener('click', () => {
    document.getElementById('video-form').reset();
    document.getElementById('video-id').value = '';
    document.getElementById('video-form-title').innerText = 'Novo Vídeo';
    videosListView.classList.add('hidden');
    videoFormView.classList.remove('hidden');
});

document.getElementById('cancel-video-btn').addEventListener('click', loadVideos);

document.getElementById('video-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('video-id').value;
    const payload = {
        title: document.getElementById('video-title').value,
        description: document.getElementById('video-desc').value,
        video_url: document.getElementById('video-url').value,
        duration: parseInt(document.getElementById('video-duration').value, 10),
        status: document.getElementById('video-status').value
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/videos/${id}` : `${API_BASE}/videos`;
    
    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    loadVideos();
});

window.editVideo = async (id) => {
    const res = await fetch(`${API_BASE}/videos/${id}`);
    const video = await res.json();
    
    document.getElementById('video-id').value = video.id;
    document.getElementById('video-title').value = video.title;
    document.getElementById('video-desc').value = video.description;
    document.getElementById('video-url').value = video.video_url;
    document.getElementById('video-duration').value = video.duration;
    document.getElementById('video-status').value = video.status;
    
    document.getElementById('video-form-title').innerText = 'Editar Vídeo';
    videosListView.classList.add('hidden');
    videoFormView.classList.remove('hidden');
};

window.deleteVideo = async (id) => {
    if(confirm('Tem certeza? Isso apagará o vídeo e suas perguntas associadas.')) {
        await fetch(`${API_BASE}/videos/${id}`, { method: 'DELETE' });
        loadVideos();
    }
};

// ================= QUESTIONS =================

window.manageQuestions = async (videoId, videoTitle) => {
    currentVideoId = videoId;
    document.getElementById('q-video-title').innerText = videoTitle;
    videosListView.classList.add('hidden');
    questionsView.classList.remove('hidden');
    loadQuestions();
};

document.getElementById('back-to-videos-btn').addEventListener('click', loadVideos);

async function loadQuestions() {
    document.getElementById('question-form-container').classList.add('hidden');
    const res = await fetch(`${API_BASE}/videos/${currentVideoId}/questions`);
    const questions = await res.json();
    
    const tbody = document.getElementById('questions-tbody');
    tbody.innerHTML = '';
    
    questions.forEach(q => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${q.minuto_disparo}</td>
            <td>${q.enunciado}</td>
            <td>
                <!-- No edit logic for MVP simplicity, just delete and recreate to save time, or we can easily map fields -->
                <button onclick="editQuestion(${q.id})" class="btn btn-small btn-secondary">Editar</button>
                <button onclick="deleteQuestion(${q.id})" class="btn btn-small btn-danger">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('new-question-btn').addEventListener('click', () => {
    document.getElementById('question-form').reset();
    document.getElementById('q-id').value = '';
    document.getElementById('question-form-container').classList.remove('hidden');
});

document.getElementById('cancel-question-btn').addEventListener('click', () => {
    document.getElementById('question-form-container').classList.add('hidden');
});

document.getElementById('question-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('q-id').value;
    const payload = {
        video_id: currentVideoId,
        minuto_disparo: parseFloat(document.getElementById('q-minuto').value),
        enunciado: document.getElementById('q-enunciado').value,
        alternativa_a: document.getElementById('q-alta').value,
        alternativa_b: document.getElementById('q-altb').value,
        alternativa_c: document.getElementById('q-altc').value,
        alternativa_d: document.getElementById('q-altd').value,
        alternativa_correta: document.getElementById('q-correta').value,
        feedback_correto: document.getElementById('q-feedback-c').value,
        feedback_errado: document.getElementById('q-feedback-e').value,
        ativo: 'ativo'
    };
    
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE}/questions/${id}` : `${API_BASE}/questions`;
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if(!res.ok) {
            const error = await res.json();
            alert(error.error);
            return;
        }
        
        loadQuestions();
    } catch (err) {
        console.error(err);
    }
});

window.editQuestion = async (id) => {
    // For simplicity, we get all and filter
    const res = await fetch(`${API_BASE}/videos/${currentVideoId}/questions`);
    const questions = await res.json();
    const q = questions.find(x => x.id === id);
    if(q) {
        document.getElementById('q-id').value = q.id;
        document.getElementById('q-minuto').value = q.minuto_disparo;
        document.getElementById('q-enunciado').value = q.enunciado;
        document.getElementById('q-alta').value = q.alternativa_a;
        document.getElementById('q-altb').value = q.alternativa_b;
        document.getElementById('q-altc').value = q.alternativa_c;
        document.getElementById('q-altd').value = q.alternativa_d;
        document.getElementById('q-correta').value = q.alternativa_correta;
        document.getElementById('q-feedback-c').value = q.feedback_correto;
        document.getElementById('q-feedback-e').value = q.feedback_errado;
        document.getElementById('question-form-container').classList.remove('hidden');
    }
};

window.deleteQuestion = async (id) => {
    if(confirm('Tem certeza em excluir esta pergunta?')) {
        await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
        loadQuestions();
    }
};
