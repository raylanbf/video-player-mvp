// Embed isolated script
const API_BASE = '/api';

const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('v');
const userId = urlParams.get('u') || 'aluno_embed_anon';

const videoEl = document.getElementById('video-player');
const modalOverlay = document.getElementById('question-modal');
const continueBtn = document.getElementById('modal-continue-btn');

let questions = [];
let answeredQuestions = new Set();
let currentQuestion = null;

async function initEmbed() {
    if (!videoId) {
        document.body.innerHTML = '<h2 style="color:white; text-align:center; padding-top:20%;">Vídeo não encontrado ou ID inválido.</h2>';
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE}/student/video/${videoId}`);
        if(!res.ok) throw new Error('Video loading failed');
        
        const data = await res.json();
        
        // Proxy token
        const securityToken = btoa(userId + '-' + Date.now());
        videoEl.src = data.video.video_url + '?token=' + securityToken;
        
        // Logo
        if (data.video.logo_url) {
            const logoImg = document.createElement('img');
            logoImg.src = data.video.logo_url;
            logoImg.className = 'player-custom-logo';
            document.querySelector('.embed-wrapper').appendChild(logoImg);
        }
        
        questions = data.questions || [];
        
        // Anti-Piracy Watermark
        startDynamicWatermark(userId);
        
        // Progress Logic
        await loadProgress();
        
    } catch (err) {
        console.error(err);
        document.body.innerHTML = '<h2 style="color:white; text-align:center; padding-top:20%;">Erro ao carregar o vídeo.</h2>';
    }
}

async function loadProgress() {
    try {
        const res = await fetch(`${API_BASE}/student/progress/${userId}/${videoId}`);
        const progress = await res.json();
        if (progress && progress.current_time) {
            videoEl.currentTime = progress.current_time;
        }
        
        // Fetch answered
        const ansRes = await fetch(`${API_BASE}/student/answers/${userId}/${videoId}`);
        const ansRecords = await ansRes.json();
        ansRecords.forEach(a => {
            if (a.is_correct) answeredQuestions.add(a.question_id);
        });
        
    } catch(err) { console.error('Error loading progress:', err); }
}

async function saveProgress() {
    if (videoEl.paused) return; // don't spam if paused
    try {
        await fetch(`${API_BASE}/student/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                video_id: videoId,
                current_time: videoEl.currentTime,
                is_completed: videoEl.ended
            })
        });
    } catch(err) { console.error(err); }
}

// Progress saving interval
setInterval(saveProgress, 5000);

// Video Time Update Logic (The core logic to trigger questions and block skips)
let lastSafeTime = 0;

videoEl.addEventListener('timeupdate', () => {
    const currentTime = videoEl.currentTime;
    
    // 1. Anti-skip block
    if (currentTime > lastSafeTime + 2) {
        // user dragged the bar too far ahead
        videoEl.currentTime = lastSafeTime;
        return;
    }
    lastSafeTime = currentTime;

    // 2. Question triggers
    const currentMin = currentTime / 60;
    
    // Find a question we just passed (+- a small threshold) that hasn't been answered correctly yet
    const pendingQ = questions.find(q => {
        // If we crossed its exact second
        return (currentMin >= q.minuto_disparo) && 
               (currentMin <= q.minuto_disparo + (2/60)) && // 2 seconds leeway
               !answeredQuestions.has(q.id);
    });
    
    if (pendingQ) {
        videoEl.pause();
        // ensure we don't accidentally skip past it
        lastSafeTime = pendingQ.minuto_disparo * 60 - 1; 
        videoEl.currentTime = pendingQ.minuto_disparo * 60;
        showQuestion(pendingQ);
    }
});

// Security: Prevent seekbar trickery
videoEl.addEventListener('seeking', () => {
    if (videoEl.currentTime > lastSafeTime + 1) {
        videoEl.currentTime = lastSafeTime;
    }
});

function showQuestion(qObj) {
    currentQuestion = qObj;
    document.getElementById('modal-enunciado').innerText = qObj.enunciado;
    
    const optionsContainer = document.getElementById('modal-options');
    optionsContainer.innerHTML = '';
    
    ['a', 'b', 'c', 'd'].forEach(letter => {
        const txt = qObj[`alternativa_${letter}`];
        if(!txt) return;
        
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = `${letter.toUpperCase()}) ${txt}`;
        btn.onclick = () => selectOption(btn, letter);
        optionsContainer.appendChild(btn);
    });
    
    document.getElementById('modal-feedback').classList.add('hidden');
    continueBtn.classList.add('hidden');
    modalOverlay.classList.remove('hidden');
}

function selectOption(btnElement, selectedLetter) {
    // Single choice
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
    
    submitAnswer(selectedLetter, btnElement);
}

async function submitAnswer(selectedLetter, btnElement) {
    const feedbackEl = document.getElementById('modal-feedback');
    const isCorrect = selectedLetter === currentQuestion.alternativa_correta.toLowerCase();
    
    // Save answer via microservice PHP logic simulation (Node.js fallback for now via API)
    try {
        await fetch(`${API_BASE}/student/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                video_id: videoId,
                question_id: currentQuestion.id,
                selected_option: selectedLetter,
                is_correct: isCorrect
            })
        });
    } catch(e) { console.error('Error saving answer', e); }

    feedbackEl.classList.remove('hidden', 'success', 'error');
    
    if (isCorrect) {
        btnElement.classList.add('correct');
        feedbackEl.classList.add('success');
        feedbackEl.innerText = currentQuestion.feedback_correto || 'Correto! Você pode continuar o vídeo.';
        answeredQuestions.add(currentQuestion.id);
        
        continueBtn.classList.remove('hidden');
    } else {
        btnElement.classList.add('wrong');
        feedbackEl.classList.add('error');
        feedbackEl.innerText = currentQuestion.feedback_errado || 'Incorreto. Tente novamente.';
    }
}

continueBtn.addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    currentQuestion = null;
    videoEl.play();
});

// Front-end Security
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', (event) => {
    if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J' || event.key === 'C')) || (event.ctrlKey && (event.key === 'U' || event.key === 'S'))) {
        event.preventDefault();
    }
});
document.addEventListener('dragstart', event => event.preventDefault());

function startDynamicWatermark(userIdentifier) {
    const watermark = document.createElement('div');
    watermark.innerText = `ID: ${userIdentifier}\nProtegido`;
    watermark.style.position = 'absolute';
    watermark.style.color = 'rgba(255, 255, 255, 0.4)'; 
    watermark.style.fontSize = '1.2rem';
    watermark.style.fontWeight = 'bold';
    watermark.style.textShadow = '1px 1px 2px black';
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '50';
    watermark.style.userSelect = 'none';
    
    document.querySelector('.embed-wrapper').appendChild(watermark);

    setInterval(() => {
        const topPos = Math.floor(Math.random() * 80) + 10;
        const leftPos = Math.floor(Math.random() * 80) + 10;
        watermark.style.top = `${topPos}%`;
        watermark.style.left = `${leftPos}%`;
        watermark.style.opacity = Math.random() * (0.6 - 0.2) + 0.2;
    }, 5000);
}

// Start
initEmbed();
