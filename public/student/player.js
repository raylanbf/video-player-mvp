const API_BASE = '/api';

// DOM Elements
const videoEl = document.getElementById('video-player');
const videoTitle = document.getElementById('video-title');
const videoDesc = document.getElementById('video-desc');

const modalOverlay = document.getElementById('question-modal');
const qEnunciado = document.getElementById('q-enunciado');
const qOptions = document.getElementById('q-options');
const qFeedback = document.getElementById('q-feedback');
const qContinueBtn = document.getElementById('q-continue-btn');

// State
let videoId = new URLSearchParams(window.location.search).get('v');
let userId = 'demo-student-' + Math.floor(Math.random() * 1000); // Fake session ID MVP

// Check if user already has a session
if(localStorage.getItem('fakeStudentId')) {
    userId = localStorage.getItem('fakeStudentId');
} else {
    localStorage.setItem('fakeStudentId', userId);
}

if (!videoId) {
    alert('ID do vídeo não especificado.');
    window.location.href = '/';
}

let questions = [];
let answeredQuestionsIds = [];
let currentQuestion = null;
let maxTimeWatched = 0;
let progressSavingInterval = null;

// Initialize
async function init() {
    try {
        const res = await fetch(`${API_BASE}/student/video/${videoId}`);
        if (!res.ok) {
            alert('Erro ao carregar vídeo.');
            return;
        }
        const data = await res.json();
        
        // Use a generated session token for the request
        const securityToken = btoa(userId + '-' + Date.now());
        videoEl.src = data.video.video_url + '?token=' + securityToken;
        
        videoTitle.innerText = data.video.title;
        videoDesc.innerText = data.video.description || '';
        
        questions = data.questions || [];
        
        // Start Anti-Piracy Watermark
        startDynamicWatermark(userId);
        
        // Load progress
        await loadProgress();
        
        setupPlayerEvents();
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

async function loadProgress() {
    const res = await fetch(`${API_BASE}/student/progress/${userId}/${videoId}`);
    const prog = await res.json();
    
    answeredQuestionsIds = prog.answered_questions || [];
    maxTimeWatched = prog.current_time || 0;
    
    // Resume playback where it stopped if not concluded
    if (!prog.concluido && maxTimeWatched > 0) {
        videoEl.currentTime = maxTimeWatched;
    }
}

async function saveProgress(concluido = false) {
    await fetch(`${API_BASE}/student/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            video_id: videoId,
            current_time: maxTimeWatched,
            ultima_pergunta_respondida: answeredQuestionsIds[answeredQuestionsIds.length - 1] || 0,
            concluido: concluido
        })
    });
}

function setupPlayerEvents() {
    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('seeking', handleSeeking);
    videoEl.addEventListener('ended', () => saveProgress(true));
    
    // Save progress periodically
    progressSavingInterval = setInterval(() => {
        if (!videoEl.paused) {
            saveProgress();
        }
    }, 5000);
}

function handleTimeUpdate() {
    if (videoEl.paused || videoEl.seeking) return;

    // Time is in seconds, min_disparo is in minutes
    const currentMin = videoEl.currentTime / 60;
    
    // Check if we passed maximum allowed watched time
    if (videoEl.currentTime > maxTimeWatched) {
        maxTimeWatched = videoEl.currentTime;
    }

    // Find if there is an unanswered question at the current time (within a small margin)
    // margin: 1 second = 1/60 
    const margin = 0.5 / 60; // 0.5 seconds margin to trigger

    const pendingQ = questions.find(q => {
        // Dispara se o minuto_disparo estiver perto do tempo atual E não tiver sido respondida ainda
        return Math.abs(currentMin - q.minuto_disparo) <= margin && !answeredQuestionsIds.includes(q.id);
    });

    if (pendingQ) {
        triggerQuestion(pendingQ);
    }
}

function handleSeeking() {
    // Prevent skip ahead past un-answered checkpoints
    const targetMin = videoEl.currentTime / 60;
    
    // Find first unanswered question
    const firstUnansweredQ = questions.find(q => !answeredQuestionsIds.includes(q.id));
    
    if (firstUnansweredQ) {
        // Se usuário tenta ir além da primeira pergunta não respondida
        if (targetMin > firstUnansweredQ.minuto_disparo) {
            videoEl.currentTime = firstUnansweredQ.minuto_disparo * 60; // Volta para o ponto da pergunta
        }
    } else {
         // Se não há perguntas não respondidas, não pode pular para além do máximo já assistido
         // para evitar pular pro final diretamente (opcional na MVP, mas regra boa)
         if (videoEl.currentTime > maxTimeWatched + 2) { // 2s tolerance
             videoEl.currentTime = maxTimeWatched;
         }
    }
}

function triggerQuestion(q) {
    if (currentQuestion) return; // Prevent double trigger
    
    videoEl.pause();
    currentQuestion = q;
    
    qEnunciado.innerText = q.enunciado;
    qOptions.innerHTML = '';
    
    const options = [
        { key: 'a', text: q.alternativa_a },
        { key: 'b', text: q.alternativa_b },
        { key: 'c', text: q.alternativa_c },
        { key: 'd', text: q.alternativa_d }
    ];
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${opt.key.toUpperCase()} - ${opt.text}`;
        btn.onclick = () => selectOption(opt.key, btn);
        qOptions.appendChild(btn);
    });
    
    qFeedback.classList.add('hidden');
    qContinueBtn.classList.add('hidden');
    modalOverlay.classList.remove('hidden');
}

async function selectOption(selectedKey, btnEl) {
    // Disable all options
    document.querySelectorAll('.option-btn').forEach(b => {
        b.disabled = true;
        if(b === btnEl) b.classList.add('selected');
    });
    
    const res = await fetch(`${API_BASE}/student/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            video_id: videoId,
            question_id: currentQuestion.id,
            resposta_marcada: selectedKey
        })
    });
    
    const result = await res.json();
    
    qFeedback.classList.remove('hidden');
    
    if (result.acertou) {
        btnEl.classList.add('correct');
        qFeedback.className = 'feedback-msg success';
        qFeedback.innerText = result.feedback_correto;
        qContinueBtn.classList.remove('hidden');
        
        answeredQuestionsIds.push(currentQuestion.id);
        saveProgress();
    } else {
        btnEl.classList.add('wrong');
        qFeedback.className = 'feedback-msg error';
        qFeedback.innerText = result.feedback_errado;
        
        // Allow retry after 3 seconds, or a retry button
        setTimeout(() => {
            qFeedback.classList.add('hidden');
            document.querySelectorAll('.option-btn').forEach(b => {
                b.disabled = false;
                b.className = 'option-btn'; // reset
            });
        }, 2500);
    }
}

qContinueBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    currentQuestion = null;
    videoEl.play();
});

// ================= SECURITY =================
// 1. Prevent right-click / context menu
document.addEventListener('contextmenu', event => event.preventDefault());

// 2. Prevent keyboard shortcuts for DevTools and Saving
document.addEventListener('keydown', (event) => {
    // Block F12 (DevTools)
    if (event.key === 'F12' || event.keyCode === 123) {
        event.preventDefault();
        return false;
    }
    
    // Block Ctrl+S / Cmd+S (Save)
    if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        return false;
    }

    // Block Ctrl+U / Cmd+U (View Source)
    if ((event.ctrlKey || event.metaKey) && (event.key === 'u' || event.key === 'U')) {
        event.preventDefault();
        return false;
    }

    // Block Ctrl+Shift+I / J / C (DevTools)
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'I' || event.key === 'i' || event.key === 'J' || event.key === 'j' || event.key === 'C' || event.key === 'c')) {
        event.preventDefault();
        return false;
    }
});

// 3. Prevent dragging text or elements
document.addEventListener('dragstart', event => event.preventDefault());

// 4. Dynamic Watermark
function startDynamicWatermark(userIdentifier) {
    const watermark = document.createElement('div');
    watermark.innerText = `ID do Aluno: ${userIdentifier}\nProtegido por Direitos Autorais`;
    watermark.style.position = 'absolute';
    watermark.style.color = 'rgba(255, 255, 255, 0.4)'; // Semitransparent white
    watermark.style.fontSize = '1.2rem';
    watermark.style.fontWeight = 'bold';
    watermark.style.textShadow = '1px 1px 2px black';
    watermark.style.pointerEvents = 'none'; // so it doesn't block clicks
    watermark.style.zIndex = '50';
    watermark.style.userSelect = 'none';
    
    document.querySelector('.video-wrapper').appendChild(watermark);

    // Float around to prevent simple cropping or static blur
    setInterval(() => {
        const topPos = Math.floor(Math.random() * 80) + 10; // 10% to 90%
        const leftPos = Math.floor(Math.random() * 80) + 10;
        watermark.style.top = `${topPos}%`;
        watermark.style.left = `${leftPos}%`;
        watermark.style.opacity = Math.random() * (0.6 - 0.2) + 0.2; // pulse opacity
    }, 5000); // changes position every 5 seconds
}

// Start
init();
