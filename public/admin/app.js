const API_BASE = '/api';

// Elements
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const videosListView = document.getElementById('videos-list-view');
const videoFormView = document.getElementById('video-form-view');
const questionsView = document.getElementById('questions-view');
const cursosListView = document.getElementById('cursos-list-view');
const modulosListView = document.getElementById('modulos-list-view');

let currentVideoId = null;
let token = localStorage.getItem('adminToken');

// API Wrapper - usa caminhos diretos sem depender de .htaccess
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
        const res = await fetch(`${API_BASE}/auth.php`, {
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

function hideAllViews() {
    videosListView.classList.add('hidden');
    videoFormView.classList.add('hidden');
    questionsView.classList.add('hidden');
    document.getElementById('config-wrapper').classList.add('hidden');
    cursosListView.classList.add('hidden');
    modulosListView.classList.add('hidden');
}

document.getElementById('show-videos-btn').addEventListener('click', () => {
    hideAllViews();
    videosListView.classList.remove('hidden');
    loadVideos();
});

document.getElementById('show-config-btn').addEventListener('click', () => {
    hideAllViews();
    document.getElementById('config-wrapper').classList.remove('hidden');
});

document.getElementById('show-cursos-btn').addEventListener('click', () => {
    hideAllViews();
    cursosListView.classList.remove('hidden');
    loadCursos();
});

document.getElementById('show-modulos-btn').addEventListener('click', () => {
    hideAllViews();
    modulosListView.classList.remove('hidden');
    loadModulos();
});

// Config Logic
document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const logo_url = document.getElementById('config-logo').value;
    try {
        const res = await apiFetch('/admin/instituicao_logo.php', {
            method: 'PUT',
            body: JSON.stringify({ logo_url })
        });
        const data = await res.json();
        if (data.success) {
            alert('Configurações salvas!');
        } else {
            alert('Erro: ' + data.error);
        }
    } catch (err) {
        alert('Erro de rede.');
    }
});

// ================= CURSOS =================
async function loadCursos() {
    const res = await apiFetch('/admin/cursos.php');
    const cursos = await res.json();
    const tbody = document.getElementById('cursos-tbody');
    tbody.innerHTML = '';
    cursos.forEach(c => {
        tbody.innerHTML += `<tr>
            <td>${c.id}</td>
            <td>${c.nome}</td>
            <td>${c.status}</td>
            <td>
                <button onclick="editCurso(${c.id}, '${c.nome.replace(/'/g,"\\'")}', '${c.status}')" class="btn btn-small btn-secondary">Editar</button>
                <button onclick="deleteCurso(${c.id})" class="btn btn-small btn-danger">Excluir</button>
            </td>
        </tr>`;
    });
}

document.getElementById('curso-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('curso-id').value;
    const nome = document.getElementById('curso-nome').value;
    const status = document.getElementById('curso-status').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/cursos.php?id=${id}` : `/admin/cursos.php`;

    await apiFetch(url, { method, body: JSON.stringify({ nome, status }) });
    document.getElementById('curso-form').reset();
    document.getElementById('curso-id').value = '';
    document.getElementById('cancel-curso-btn').classList.add('hidden');
    loadCursos();
});

document.getElementById('cancel-curso-btn').addEventListener('click', () => {
    document.getElementById('curso-form').reset();
    document.getElementById('curso-id').value = '';
    document.getElementById('cancel-curso-btn').classList.add('hidden');
});

window.editCurso = (id, nome, status) => {
    document.getElementById('curso-id').value = id;
    document.getElementById('curso-nome').value = nome;
    document.getElementById('curso-status').value = status;
    document.getElementById('cancel-curso-btn').classList.remove('hidden');
};

window.deleteCurso = async (id) => {
    if (confirm('Atenção: Excluir um curso não exclui automaticamente os vídeos associados. Continuar?')) {
        await apiFetch(`/admin/cursos.php?id=${id}`, { method: 'DELETE' });
        loadCursos();
    }
};

// ================= MÓDULOS =================
async function loadModulos() {
    const cres = await apiFetch('/admin/cursos.php');
    const cursos = await cres.json();
    const select = document.getElementById('modulo-curso-id');
    select.innerHTML = '<option value="">Selecione o Curso...</option>';
    cursos.forEach(c => select.innerHTML += `<option value="${c.id}">${c.nome}</option>`);

    const res = await apiFetch('/admin/modulos.php');
    const modulos = await res.json();
    const tbody = document.getElementById('modulos-tbody');
    tbody.innerHTML = '';
    modulos.forEach(m => {
        tbody.innerHTML += `<tr>
            <td>${m.id}</td>
            <td>${m.nome}</td>
            <td>${m.curso_nome}</td>
            <td>${m.status}</td>
            <td>
                <button onclick="editModulo(${m.id}, '${m.nome.replace(/'/g,"\\'")}', ${m.curso_id}, '${m.status}')" class="btn btn-small btn-secondary">Editar</button>
                <button onclick="deleteModulo(${m.id})" class="btn btn-small btn-danger">Excluir</button>
            </td>
        </tr>`;
    });
}

document.getElementById('modulo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('modulo-id').value;
    const nome = document.getElementById('modulo-nome').value;
    const curso_id = document.getElementById('modulo-curso-id').value;
    const status = document.getElementById('modulo-status').value;
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/modulos.php?id=${id}` : `/admin/modulos.php`;

    await apiFetch(url, { method, body: JSON.stringify({ nome, curso_id, status }) });
    document.getElementById('modulo-form').reset();
    document.getElementById('modulo-id').value = '';
    document.getElementById('cancel-modulo-btn').classList.add('hidden');
    loadModulos();
});

document.getElementById('cancel-modulo-btn').addEventListener('click', () => {
    document.getElementById('modulo-form').reset();
    document.getElementById('modulo-id').value = '';
    document.getElementById('cancel-modulo-btn').classList.add('hidden');
});

window.editModulo = (id, nome, curso_id, status) => {
    document.getElementById('modulo-id').value = id;
    document.getElementById('modulo-nome').value = nome;
    document.getElementById('modulo-curso-id').value = curso_id;
    document.getElementById('modulo-status').value = status;
    document.getElementById('cancel-modulo-btn').classList.remove('hidden');
};

window.deleteModulo = async (id) => {
    if (confirm('Atenção: Excluir um módulo não exclui automaticamente os vídeos associados. Continuar?')) {
        await apiFetch(`/admin/modulos.php?id=${id}`, { method: 'DELETE' });
        loadModulos();
    }
};

// ================= VIDEOS =================

async function populateVideoFormDropdowns() {
    const cursoSelect = document.getElementById('video-curso-id');
    const res = await apiFetch('/admin/cursos.php');
    const cursos = await res.json();
    cursoSelect.innerHTML = '<option value="">Selecione o Curso...</option>';
    cursos.forEach(c => cursoSelect.innerHTML += `<option value="${c.id}">${c.nome}</option>`);
}

window.loadModulosForVideoForm = async (selectedModuloId = null) => {
    const curso_id = document.getElementById('video-curso-id').value;
    const moduloSelect = document.getElementById('video-modulo-id');
    moduloSelect.innerHTML = '<option value="">Selecione o Módulo...</option>';

    if (!curso_id) return;

    const res = await apiFetch(`/admin/modulos.php?curso_id=${curso_id}`);
    const modulos = await res.json();
    modulos.forEach(m => {
        const selected = m.id == selectedModuloId ? 'selected' : '';
        moduloSelect.innerHTML += `<option value="${m.id}" ${selected}>${m.nome}</option>`;
    });
};

async function loadVideos() {
    hideAllViews();
    videosListView.classList.remove('hidden');

    const res = await apiFetch('/admin/videos.php');
    if (res.status === 403) return document.getElementById('logout-btn').click();

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
                <button onclick="copyEmbedCode(${v.id}, ${v.instituicao_id}, ${v.curso_id}, ${v.modulo_id})" class="btn btn-small btn-secondary" style="background:#4b5563;">Copiar Embed</button>
                <button onclick="deleteVideo(${v.id})" class="btn btn-small btn-danger">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('new-video-btn').addEventListener('click', async () => {
    document.getElementById('video-form').reset();
    document.getElementById('video-id').value = '';
    document.getElementById('video-form-title').innerText = 'Novo Vídeo';
    document.getElementById('video-modulo-id').innerHTML = '<option value="">Selecione o curso primeiro...</option>';

    hideAllViews();
    videoFormView.classList.remove('hidden');

    await populateVideoFormDropdowns();
});

document.getElementById('cancel-video-btn').addEventListener('click', loadVideos);

document.getElementById('video-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('video-id').value;
    const payload = {
        title: document.getElementById('video-title').value,
        description: document.getElementById('video-desc').value,
        video_url: document.getElementById('video-url').value,
        curso_id: document.getElementById('video-curso-id').value,
        modulo_id: document.getElementById('video-modulo-id').value,
        duration: parseInt(document.getElementById('video-duration').value, 10),
        status: document.getElementById('video-status').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/videos.php?id=${id}` : `/admin/videos.php`;

    const res = await apiFetch(url, {
        method,
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.error) {
        alert(data.error);
        return;
    }

    loadVideos();
});

window.editVideo = async (id) => {
    const res = await apiFetch(`/admin/videos.php?id=${id}`);
    const video = await res.json();

    document.getElementById('video-id').value = video.id;
    document.getElementById('video-title').value = video.title;
    document.getElementById('video-desc').value = video.description;
    document.getElementById('video-url').value = video.video_url;
    document.getElementById('video-duration').value = video.duration;
    document.getElementById('video-status').value = video.status;

    hideAllViews();
    videoFormView.classList.remove('hidden');

    await populateVideoFormDropdowns();
    document.getElementById('video-curso-id').value = video.curso_id;
    await window.loadModulosForVideoForm(video.modulo_id);

    document.getElementById('video-form-title').innerText = 'Editar Vídeo';
};

window.deleteVideo = async (id) => {
    if (confirm('Tem certeza? Isso apagará o vídeo e suas perguntas associadas.')) {
        await apiFetch(`/admin/videos.php?id=${id}`, { method: 'DELETE' });
        loadVideos();
    }
};

window.copyEmbedCode = (id, inst_id, curso_id, modulo_id) => {
    const domain = window.location.origin;
    const embedCode = `<iframe src="${domain}/embed/player.html?v=${id}&i=${inst_id}&c=${curso_id}&m=${modulo_id}&u=[ID_DO_ALUNO]" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

    navigator.clipboard.writeText(embedCode).then(() => {
        alert("Código de Incorporação copiado!\n\nLembre-se de substituir [ID_DO_ALUNO] pelo código/e-mail real do usuário.");
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
    const res = await apiFetch(`/admin/questions.php?videoId=${currentVideoId}`);
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
    const url = id ? `/admin/questions.php?id=${id}` : `/admin/questions.php`;

    try {
        const res = await apiFetch(url, {
            method,
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            alert(data.error || 'Erro ao salvar pergunta');
            return;
        }

        loadQuestions();
    } catch (err) {
        console.error(err);
    }
});

window.editQuestion = async (id) => {
    const res = await apiFetch(`/admin/questions.php?videoId=${currentVideoId}`);
    const questions = await res.json();
    const q = questions.find(x => x.id === id);
    if (q) {
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
    if (confirm('Tem certeza em excluir esta pergunta?')) {
        await apiFetch(`/admin/questions.php?id=${id}`, { method: 'DELETE' });
        loadQuestions();
    }
};
