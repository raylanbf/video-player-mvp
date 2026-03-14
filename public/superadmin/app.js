const API_BASE = '/api';
let token = localStorage.getItem('super_token');

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    document.getElementById('new-inst-btn').addEventListener('click', () => showView('form'));
    document.getElementById('cancel-inst-btn').addEventListener('click', () => showView('list'));
    document.getElementById('inst-form').addEventListener('submit', handleCreateInst);
    
    // Register logic
    document.getElementById('show-register-btn').addEventListener('click', () => {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('register-section').classList.remove('hidden');
    });
    
    document.getElementById('show-login-btn').addEventListener('click', () => {
        document.getElementById('register-section').classList.add('hidden');
        document.getElementById('login-section').classList.remove('hidden');
    });
    
    document.getElementById('register-form').addEventListener('submit', handleRegister);
});

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const res = await fetch(`${API_BASE}/auth.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await res.json();
        
        if (data.success && data.role === 'superadmin') {
            localStorage.setItem('super_token', data.token);
            token = data.token;
            checkAuth();
        } else {
            errorEl.innerText = data.message || 'Acesso negado (não é superadmin)';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.innerText = 'Erro ao conectar ao servidor';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value;
    const pass = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('register-error');
    const successEl = document.getElementById('register-success');
    
    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/register.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        
        const data = await res.json();
        
        if (data.success) {
            successEl.innerText = data.message;
            successEl.style.display = 'block';
            document.getElementById('register-form').reset();
            
            // Auto login after 2 seconds
            setTimeout(() => {
                document.getElementById('show-login-btn').click();
                document.getElementById('username').value = user;
                document.getElementById('password').value = pass;
            }, 2000);
        } else {
            errorEl.innerText = data.message || 'Erro ao criar conta';
            errorEl.style.display = 'block';
        }
    } catch (err) {
        errorEl.innerText = 'Erro ao conectar ao servidor';
        errorEl.style.display = 'block';
    }
}

function handleLogout() {
    localStorage.removeItem('super_token');
    token = null;
    checkAuth();
}

function checkAuth() {
    if (token) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('dashboard-section').classList.remove('hidden');
        loadInstitutions();
    } else {
        document.getElementById('login-section').classList.remove('hidden');
        document.getElementById('dashboard-section').classList.add('hidden');
    }
}

function showView(view) {
    if (view === 'list') {
        document.getElementById('inst-list-view').classList.remove('hidden');
        document.getElementById('inst-form-view').classList.add('hidden');
        document.getElementById('inst-created-info').classList.add('hidden');
        document.getElementById('inst-form').reset();
        document.getElementById('inst-id').value = '';
    } else {
        document.getElementById('inst-list-view').classList.add('hidden');
        document.getElementById('inst-form-view').classList.remove('hidden');
        
        // Reset specific fields visibility behavior based on action
        const isEdit = document.getElementById('inst-id').value !== '';
        if (isEdit) {
            document.getElementById('inst-form-title').innerText = 'Editar Instituição';
            document.getElementById('inst-credentials-section').classList.add('hidden');
            document.getElementById('inst-status-section').classList.remove('hidden');
            document.getElementById('inst-admin-email').required = false;
            document.getElementById('inst-admin-pass').required = false;
        } else {
            document.getElementById('inst-form-title').innerText = 'Cadastrar Instituição';
            document.getElementById('inst-credentials-section').classList.remove('hidden');
            document.getElementById('inst-status-section').classList.add('hidden');
            document.getElementById('inst-admin-email').required = true;
            document.getElementById('inst-admin-pass').required = true;
        }
    }
}

async function loadInstitutions() {
    try {
        const url = `${API_BASE}/superadmin/instituicoes.php`;
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.status === 403) return handleLogout();
        
        const insts = await res.json();
        const tbody = document.getElementById('inst-tbody');
        tbody.innerHTML = '';
        
        insts.forEach(i => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${i.id}</td>
                <td>${i.nome} <br> <small>${i.logo_url ? '(Possui Logo)' : ''}</small></td>
                <td>${i.videos_cadastrados} / ${i.limite_videos}</td>
                <td>${i.perguntas_cadastradas} / ${i.limite_perguntas}</td>
                <td><span class="status-badge ${i.status}">${i.status}</span></td>
                <td>
                    <button class="btn btn-small" onclick="editInstitution(${i.id}, '${i.nome.replace(/'/g, "\\'")}', ${i.limite_videos}, ${i.limite_perguntas}, '${i.logo_url || ''}', '${i.status}')">Editar</button>
                    ${i.status === 'ativo' ? 
                        `<button class="btn btn-warning btn-small" onclick="toggleStatus(${i.id}, 'inativo')">Desativar</button>` : 
                        `<button class="btn btn-success btn-small" onclick="toggleStatus(${i.id}, 'ativo')">Ativar</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error(err);
    }
}

function editInstitution(id, nome, lvideos, lperguntas, logo, status) {
    document.getElementById('inst-id').value = id;
    document.getElementById('inst-nome').value = nome;
    document.getElementById('inst-lvideo').value = lvideos;
    document.getElementById('inst-lperg').value = lperguntas;
    document.getElementById('inst-logo').value = logo;
    document.getElementById('inst-status').value = status;
    showView('form');
}

async function toggleStatus(id, newStatus) {
    // We would ideally have a PATCH endpoint, but we can just use the PUT endpoint with existing data
    // For a real MVP, it's better to implement an active/inactive toggle properly
    alert('Esta ação pode ser feita pelo botão Editar.');
}

async function handleCreateInst(e) {
    e.preventDefault();
    
    const id = document.getElementById('inst-id').value;
    const isEdit = id !== '';
    
    const payload = {
        nome: document.getElementById('inst-nome').value,
        limite_videos: parseInt(document.getElementById('inst-lvideo').value),
        limite_perguntas: parseInt(document.getElementById('inst-lperg').value),
        logo_url: document.getElementById('inst-logo').value
    };
    
    if (isEdit) {
        payload.status = document.getElementById('inst-status').value;
    } else {
        payload.admin_email = document.getElementById('inst-admin-email').value;
        payload.admin_pass = document.getElementById('inst-admin-pass').value;
    }
    
    try {
        const fetchUrl = isEdit ? `${API_BASE}/superadmin/instituicoes.php?id=${id}` : `${API_BASE}/superadmin/instituicoes.php`;
        const fetchMethod = isEdit ? 'PUT' : 'POST';
        
        const res = await fetch(fetchUrl, {
            method: fetchMethod,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if(data.success || data.updated) {
            document.getElementById('inst-created-info').classList.remove('hidden');
            
            setTimeout(() => {
                showView('list');
                loadInstitutions();
            }, 1500);
        } else {
            alert(data.error || 'Erro ao salvar instituição');
        }
    } catch(err) {
        alert('Erro de conexão.');
    }
}
