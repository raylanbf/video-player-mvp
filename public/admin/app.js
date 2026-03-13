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
let token = localStorage.getItem('adminToken');

// API Wrapper
async function apiFetch(endpoint, options = {}) {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    if (token) defaultHeaders['Authorization'] = `Bearer ${token}`;
    
    options.headers = { ...defaultHeaders, ...options.headers };
    return fetch(`${API_BASE}${endpoint}`, options);
}

// Auth check
if (token) {
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
        if (data.success && data.role === 'admin') {
            localStorage.setItem('adminToken', data.token);
            token = data.token;
            showDashboard();
        } else {
            document.getElementById('login-error').innerText = data.message || 'Acesso negado';
            document.getElementById('login-error').style.display = 'block';
        }
    } catch (err) {
        console.error(err);
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    token = null;
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadVideos();
}

// Navigation inside Dashboard
document.getElementById('show-videos-btn').addEventListener('click', () => {
    videosListView.classList.remove('hidden');
    videoFormView.classList.add('hidden');
    questionsView.classList.add('hidden');
    document.getElementById('config-wrapper').classList.add('hidden');
    loadVideos();
});

document.getElementById('show-config-btn').addEventListener('click', () => {
    videosListView.classList.add('hidden');
    videoFormView.classList.add('hidden');
    questionsView.classList.add('hidden');
    document.getElementById('config-wrapper').classList.remove('hidden');
});

// Config Logic
document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logo_url = document.getElementById('config-logo').value;
    try {
        const res = await apiFetch('/instituicao/logo', {
            method: 'PUT',
            body: JSON.stringify({ logo_url })
        });
        const data = await res.json();
        if(data.success) {
            alert('Settings Saved!');
        } else {
            alert('Error: ' + data.error);
        }
    } catch(err) {
        alert('Network Error');
    }
});

// ================= VIDEOS =================

async function loadVideos() {
    videosListView.classList.remove('hidden');
    videoFormView.classList.add('hidden');
    questionsView.classList.add('hidden');
    document.getElementById('config-wrapper').classList.add('hidden');
    
    const res = await apiFetch('/videos');
    if(res.status === 403) return document.getElementById('logout-btn').click();
    
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
                <button onclick="copyEmbedCode(${v.id})" class="btn btn-small btn-secondary" style="background:#4b5563;">Copiar Embed</button>
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
    const url = id ? `/videos/${id}` : `/videos`;
    
    const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if(data.error) {
        alert(data.error);
        return;
    }
    
    loadVideos();
});

window.editVideo = async (id) => {
    const res = await apiFetch(`/videos/${id}`);
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
        await apiFetch(`/videos/${id}`, { method: 'DELETE' });
        loadVideos();
    }
};

window.copyEmbedCode = (id) => {
    // We assume the user needs a way to pass their student's ID dynamically via PHP/LMS later.
    // For MVP, we provide a placeholder [ID_DO_ALUNO] in the URL
    const domain = window.location.origin;
    const embedCode = `<iframe src="${domain}/embed/player.html?v=${id}&u=[ID_DO_ALUNO]" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
    
    navigator.clipboard.writeText(embedCode).then(() => {
        alert("Código de Incorporação copiado para a área de transferência!\n\nCole no seu site e lembre-se de substituir o [ID_DO_ALUNO] pelo código/e-mail real do usuário na sua plataforma.");
    }).catch(err => {
        alert('Erro ao copiar código: ' + err);
    });
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
    const res = await apiFetch(`/videos/${currentVideoId}/questions`);
    const questions = await res.json();
    
    const tbody = document.getElementById('questions-tbody');
    tbody.innerHTML = '';
    
    questions.forEach(q => {
        const m = Math.floor(q.minuto_disparo);
        const s = Math.round((q.minuto_disparo - m) * 60).toString().padStart(2, '0');
        const formattedTime = `${m}:${s}`;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formattedTime}</td>
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
    const timeValue = document.getElementById('q-minuto').value;
    const timeparts = timeValue.split(':');
    const decimalMinutes = parseInt(timeparts[0], 10) + (parseInt(timeparts[1], 10) / 60);

    const payload = {
        video_id: currentVideoId,
        minuto_disparo: decimalMinutes,
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
    const url = id ? `/questions/${id}` : `/questions`;
    
    try {
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if(!res.ok || data.error) {
            alert(data.error || 'Erro ao salvar pergunta');
            return;
        }
        
        loadQuestions();
    } catch (err) {
        console.error(err);
    }
});

window.editQuestion = async (id) => {
    // For simplicity, we get all and filter
    const res = await apiFetch(`/videos/${currentVideoId}/questions`);
    const questions = await res.json();
    const q = questions.find(x => x.id === id);
    if(q) {
        const m = Math.floor(q.minuto_disparo);
        const s = Math.round((q.minuto_disparo - m) * 60).toString().padStart(2, '0');
        
        document.getElementById('q-id').value = q.id;
        document.getElementById('q-minuto').value = `${m}:${s}`;
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
        await apiFetch(`/questions/${id}`, { method: 'DELETE' });
        loadQuestions();
    }
};
