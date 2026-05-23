// Real-Time Quiz Room Logic (Updated for current backend)

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://quiz-application-production-c0e1.up.railway.app';
const socket = io(BACKEND_URL);
const user = JSON.parse(localStorage.getItem('user'));

const urlParams = new URLSearchParams(window.location.search);
const joinCode = urlParams.get('code');
const isAdmin = urlParams.get('admin') === 'true';
const quizIdParam = urlParams.get('quizId');

// --- Internal State ---
let currentQuizId = null;
let currentQuestionId = null;
let currentCorrectAnswer = null;
let timerInterval = null;
let questionsList = []; // Admin only
let currentQuestionIndex = -1; // Admin only
let questionStartTime = null;

// --- UI Elements ---
const views = {
    lobby: document.getElementById('lobby-view'),
    question: document.getElementById('question-view'),
    leaderboard: document.getElementById('leaderboard-view'),
    wait: document.getElementById('wait-view'),
    'final-results': document.getElementById('final-results-view')
};

function showView(viewName) {
    Object.values(views).forEach(v => {
        if (v) v.classList.add('hidden');
    });
    if (views[viewName]) views[viewName].classList.remove('hidden');
}

function showWaitScreen(type) {
    const icon = document.getElementById('wait-icon');
    const title = document.getElementById('wait-title');
    const message = document.getElementById('wait-message');

    if (type === 'submitted') {
        if (icon) icon.innerText = '✨';
        if (title) title.innerText = 'Answer Received!';
        if (message) message.innerText = 'Great job! Sit tight while the others finish...';
    } else if (type === 'timeout') {
        if (icon) icon.innerText = '⏳';
        if (title) title.innerText = 'Time\'s Up!';
        if (message) message.innerText = 'Waiting for the host to publish the next question...';
        const loader = document.querySelector('#wait-view .loader');
        if (loader) loader.classList.remove('hidden');
    } else if (type === 'ended') {
        if (icon) icon.innerText = '🏁';
        if (title) title.innerText = 'Quiz Ended!';
        if (message) message.innerText = 'The host has ended the session. Thank you for participating!';
        const loader = document.querySelector('#wait-view .loader');
        if (loader) loader.classList.add('hidden');
    }

    showView('wait');
}

// --- Initialization ---

// Set Join Code from URL immediately to avoid "---" display
if (joinCode) {
    const subtitle = document.getElementById('lobby-subtitle');
    if (subtitle) {
        subtitle.innerHTML = `Join Code: <span style="color: var(--primary); font-weight: 800;">${joinCode}</span>`;
    }
}

if (isAdmin) {
    currentQuizId = quizIdParam;
    const controls = document.getElementById('admin-controls');
    if (controls) controls.classList.remove('hidden');

    const adminLobbyAction = document.getElementById('lobby-admin-action');
    if (adminLobbyAction) adminLobbyAction.classList.remove('hidden');

    const waitText = document.getElementById('student-wait-text');
    if (waitText) waitText.classList.add('hidden');

    const title = document.getElementById('lobby-title');
    if (title) title.innerText = 'Host Lobby';

    if (currentQuizId) {
        const token = localStorage.getItem('token');
        fetch(`${BACKEND_URL}/api/quizzes/${currentQuizId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                if (data.content) {
                    questionsList = data.content.questions;
                    // Update subtitle with question count
                    const subtitle = document.getElementById('lobby-subtitle');
                    if (subtitle) {
                        subtitle.innerHTML = `Join Code: <span style="color: var(--primary); font-weight: 800;">${data.content.joinCode}</span> | Questions: ${questionsList.length}`;
                    }
                    socket.emit('join-quiz', { joinCode: data.content.joinCode, username: user?.username || 'Admin', role: 'admin' });
                }
            })
            .catch(err => {
                console.error('Failed to load quiz details:', err);
                alert('Session expired or unauthorized. Please login again.');
                window.location.href = 'admin.html';
            });
    }
} else {
    // Student Setup
    if (!joinCode) {
        alert('No join code provided');
        window.location.href = 'app.php';
    }
    socket.emit('join-quiz', { joinCode, username: user?.username || 'Student', role: 'student' });
}

// --- Socket Listeners ---

socket.on('participants-update', (participants) => {
    document.getElementById('participant-count').innerText = participants.length;
});

socket.on('new-question', (question) => {
    currentQuestionId = question._id;
    currentCorrectAnswer = question.correctAnswer;
    questionStartTime = Date.now();
    showView('question');

    const feedback = document.getElementById('answer-feedback');
    if (feedback) feedback.innerText = '';

    // CLEAR LEADERBOARD FROM PREVIOUS QUESTION
    renderCurrentQuestionLeaderboard([]);

    document.getElementById('q-text').innerText = question.questionText;
    document.getElementById('q-marks').innerText = `${question.points || 10} Points`;

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    question.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'glass-card option-card';
        btn.innerText = opt;
        btn.onclick = () => selectOption(question._id, idx, btn);
        if (isAdmin) btn.disabled = true;
        container.appendChild(btn);
    });

    // Start Timer
    let timeLeft = question.timeLimit || 30;
    const timerEl = document.getElementById('q-timer');
    timerEl.innerText = timeLeft;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            disableAllOptions();

            // Timer Ended Logic
            if (isAdmin) {
                const startBtn = document.getElementById('admin-start-btn');
                if (startBtn) {
                    startBtn.disabled = false;
                    startBtn.innerText = 'Next Question';
                }
            }

            // Automatically show leaderboard for admin, wait screen for students
            setTimeout(() => {
                if (isAdmin) {
                    showLeaderboardView();
                } else {
                    showWaitScreen('timeout');
                }
            }, 1000);
        }
    }, 1000);
});

socket.on('leaderboard-update', ({ top10, userStats }) => {
    // Render current question speed stats
    renderCurrentQuestionLeaderboard(top10);
});

// Admin only: view incoming answers
socket.on('answer-received', (result) => {
    console.log('Answer received:', result);
    // Optionally show a notification or update a live counter
});

socket.on('quiz-ended', () => {
    if (!isAdmin) {
        showWaitScreen('ended');
    }
});

socket.on('final-results', (finalStats) => {
    showView('final-results');
    
    const statsArray = Object.keys(finalStats).map(username => ({
        username,
        ...finalStats[username]
    }));
    
    statsArray.sort((a, b) => b.totalCorrect - a.totalCorrect || b.firstPlaceCount - a.firstPlaceCount || a.totalTime - b.totalTime);
    
    const winnerNameEl = document.getElementById('winner-name');
    const winnerStatsEl = document.getElementById('winner-stats');
    
    if (statsArray.length > 0 && statsArray[0].totalCorrect > 0) {
        const topScore = statsArray[0].totalCorrect;
        const topFirstPlaces = statsArray[0].firstPlaceCount;
        const topTime = statsArray[0].totalTime;

        const winners = statsArray.filter(s => 
            s.totalCorrect === topScore && 
            s.firstPlaceCount === topFirstPlaces && 
            s.totalTime === topTime
        );

        if (winners.length > 1) {
            if(winnerNameEl) winnerNameEl.innerText = winners.map(w => w.username).join(' & ');
            if(winnerStatsEl) winnerStatsEl.innerText = `Tie! Total Correct: ${topScore}`;
        } else {
            if(winnerNameEl) winnerNameEl.innerText = winners[0].username;
            if(winnerStatsEl) winnerStatsEl.innerText = `Total Correct: ${topScore}`;
        }
    } else {
        if(winnerNameEl) winnerNameEl.innerText = "No Winner";
        if(winnerStatsEl) winnerStatsEl.innerText = "No correct answers";
    }
});

// --- Actions ---

function selectOption(questionId, selectedOption, btn) {
    disableAllOptions();
    
    if (selectedOption !== currentCorrectAnswer) {
        btn.style.backgroundColor = 'rgba(255, 50, 50, 0.4)';
        btn.style.borderColor = '#ff4d4d';
        btn.style.color = '#fff';
    } else {
        btn.style.backgroundColor = 'rgba(50, 255, 50, 0.4)';
        btn.style.borderColor = '#4dff4d';
        btn.style.color = '#fff';
    }

    const timeTaken = (Date.now() - questionStartTime) / 1000;
    socket.emit('submit-answer', {
        joinCode: joinCode,
        questionId,
        selectedOption,
        timeTaken
    });

    // Show waiting screen for students
    if (!isAdmin) {
        setTimeout(() => showWaitScreen('submitted'), 1500); // Increased delay to see selection feedback
    }
}

function disableAllOptions() {
    const btns = document.querySelectorAll('.option-card');
    btns.forEach(b => b.disabled = true);
}

function renderCurrentQuestionLeaderboard(top10) {
    const list = document.getElementById('leaderboard-list');
    if (!list) return;
    list.innerHTML = '';

    if (!top10 || top10.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No correct answers yet.</p>';
        return;
    }

    top10.forEach((p, idx) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row animate-fade-in';
        row.innerHTML = `
            <div style="display: flex; align-items: center;">
                <div class="rank">${idx + 1}</div>
                <span style="font-weight: 600; font-size: 1.25rem;">${p.username}</span>
            </div>
            <span style="font-weight: 800; color: var(--primary); font-size: 1.5rem;">${Number(p.timeTaken).toFixed(2)}s</span>
        `;
        list.appendChild(row);
    });
}

// --- Admin Controls ---

function startNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questionsList.length) {
        const question = questionsList[currentQuestionIndex];
        socket.emit('publish-question', { joinCode: joinCode, question });

        const startBtn = document.getElementById('admin-start-btn');
        if (startBtn) {
            startBtn.innerText = 'Question Live...';
            startBtn.disabled = true;
        }
    } else {
        alert('All questions published!');
        const startBtn = document.getElementById('admin-start-btn');
        if (startBtn) {
            startBtn.innerText = 'Quiz Finished';
            startBtn.disabled = true;
        }
    }
}

function showLeaderboardView() {
    showView('leaderboard');
}

function showLobbyView() {
    showView('lobby');
}

function endQuiz() {
    if (confirm('Are you sure you want to completely close this session? All participant data will be deleted.')) {
        socket.emit('end-quiz', joinCode);
        window.location.href = 'admin-dashboard.html';
    }
}

function requestFinalResults() {
    if (currentQuestionIndex < questionsList.length) {
        alert("Please finish all questions before declaring the winner!");
        return;
    }
    socket.emit('request-final-results', joinCode);
}
