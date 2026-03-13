const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('super_token');

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    document.getElementById('new-inst-btn').addEventListener('click', () => showView('form'));
    document.getElementById('cancel-inst-btn').addEventListener('click', () => showView('list'));
    
    document.getElementById('inst-form').addEventListener('submit', handleCreateInst);
});

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');
    
    try {
        const res = await fetch(`${API_URL}/admin/login`, {
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
    } else {
        document.getElementById('inst-list-view').classList.add('hidden');
        document.getElementById('inst-form-view').classList.remove('hidden');
    }
}

async function loadInstitutions() {
    try {
        const res = await fetch(`${API_URL}/superadmin/instituicoes`, {
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
            `;
            tbody.appendChild(tr);
        });
    } catch(err) {
        console.error(err);
    }
}

async function handleCreateInst(e) {
    e.preventDefault();
    
    const payload = {
        nome: document.getElementById('inst-nome').value,
        limite_videos: parseInt(document.getElementById('inst-lvideo').value),
        limite_perguntas: parseInt(document.getElementById('inst-lperg').value),
        logo_url: document.getElementById('inst-logo').value
    };
    
    try {
        const res = await fetch(`${API_URL}/superadmin/instituicoes`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if(data.success) {
            document.getElementById('new-admin-user').innerText = data.admin_user;
            document.getElementById('new-admin-pass').innerText = data.admin_pass;
            document.getElementById('inst-created-info').classList.remove('hidden');
            loadInstitutions();
            // Don't auto-redirect so they can see the credentials
        } else {
            alert(data.error || 'Erro ao criar instituição');
        }
    } catch(err) {
        alert('Erro de conexão.');
    }
}
