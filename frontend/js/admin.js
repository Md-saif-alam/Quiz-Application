const API_URL = `https://quiz-application-qu0q.onrender.com/api`;

// Simple "Session" state since backend has no JWT
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

let currentQuizId = null;

// Auth Check
if (!user || user.role !== 'admin' || !token) {
    window.location.href = 'index.html';
}

// Set User Name
const userNameEl = document.getElementById('user-name');
if (userNameEl) userNameEl.innerText = user.username;

// Logout
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// --- View Management ---

function showView(view) {
    const dashboardView = document.getElementById('dashboard-view');
    const manageView = document.getElementById('manage-view');
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => item.classList.remove('active'));

    if (view === 'dashboard') {
        dashboardView.classList.remove('hidden');
        manageView.classList.add('hidden');
        document.querySelector('.nav-item[onclick*="dashboard"]').classList.add('active');
        loadQuizzes();
    } else if (view === 'manage') {
        dashboardView.classList.add('hidden');
        manageView.classList.remove('hidden');
    }
}

// --- Quiz Management ---

async function loadQuizzes() {
    const container = document.getElementById('quizzes-container');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 404) {
            logout();
            return;
        }

        const data = await res.json();

        // Backend returns: { content: quizzes }
        if (data.content) {
            container.innerHTML = '';

            if (data.content.length === 0) {
                container.innerHTML = `
                    <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">You haven't created any quizzes yet.</p>
                        <button class="btn btn-primary" onclick="openModal('create-quiz-modal')">Create Your First Quiz</button>
                    </div>
                `;
                return;
            }

            data.content.forEach(quiz => {
                const card = document.createElement('div');
                card.className = 'glass-card quiz-card';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <h3 style="color: var(--primary); font-size: 1.4rem; font-weight: 700; margin: 0;">${quiz.title}</h3>
                        <button style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; padding: 0.2rem;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'" onclick="deleteQuiz('${quiz._id}')" title="Delete Quiz">🗑️</button>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.4;">${quiz.description || 'No description provided.'}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="font-size: 0.8rem; color: var(--text-muted);">
                            Code: <span style="color: var(--primary); font-weight: 700;">${quiz.joinCode}</span>
                        </div>
                        <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="manageQuiz('${quiz._id}')">Manage</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Failed to load quizzes', err);
    }
}

async function manageQuiz(quizId) {
    currentQuizId = quizId;
    try {
        const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.status === 401 || res.status === 404) {
            logout();
            return;
        }

        const data = await res.json();

        if (data.content) {
            document.getElementById('manage-quiz-title').innerText = data.content.title;
            document.getElementById('manage-quiz-desc').innerText = data.content.description || '';
            document.getElementById('manage-join-code').innerText = data.content.joinCode;

            const startBtn = document.getElementById('start-live-btn');
            startBtn.onclick = async () => {
                if (!data.content.questions || data.content.questions.length === 0) {
                    alert('Please add at least one question to the quiz before starting a live room.');
                    return;
                }

                // Call start quiz API
                try {
                    await fetch(`${API_URL}/quiz/start`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ quizId })
                    });
                    window.open(`quiz-room.html?admin=true&quizId=${quizId}&code=${data.content.joinCode}`, '_blank');
                } catch (e) {
                    alert('Failed to start quiz');
                }
            };

            renderQuestions(data.content.questions);
            showView('manage');
        }
    } catch (err) {
        console.error('Failed to load quiz details', err);
    }
}

async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz? This cannot be undone.')) return;

    try {
        const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            loadQuizzes(); // Refresh the list
        } else {
            alert('Failed to delete quiz');
        }
    } catch (err) {
        console.error('Delete failed', err);
        alert('An error occurred while deleting');
    }
}

// --- Create Quiz ---

document.getElementById('create-quiz-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('quiz-title').value;
    const description = document.getElementById('quiz-desc').value;
    const errorEl = document.getElementById('create-quiz-error');
    
    if (errorEl) {
        errorEl.classList.add('hidden');
        errorEl.innerText = '';
    }

    try {
        const res = await fetch(`${API_URL}/create_quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, description })
        });
        const data = await res.json();
        
        if (res.ok && data.content) {
            document.getElementById('create-quiz-form').reset();
            closeModal('create-quiz-modal');
            manageQuiz(data.content._id);
        } else {
            if (errorEl) {
                errorEl.innerText = data.message || 'Failed to create quiz.';
                errorEl.classList.remove('hidden');
            } else {
                alert(data.message || 'Failed to create quiz.');
            }
        }
    } catch (err) {
        console.error('Create quiz failed', err);
        if (errorEl) {
            errorEl.innerText = 'Server connection failed.';
            errorEl.classList.remove('hidden');
        }
    }
});

// --- Question Management ---

document.getElementById('add-question-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const questionText = document.getElementById('q-text').value;
    const options = [
        document.getElementById('q-opt0').value,
        document.getElementById('q-opt1').value,
        document.getElementById('q-opt2').value,
        document.getElementById('q-opt3').value
    ];
    const correctAnswer = parseInt(document.getElementById('q-correct').value);
    const timeLimit = parseInt(document.getElementById('q-time').value);
    const points = parseInt(document.getElementById('q-marks').value); // Backend uses 'points'

    try {
        const res = await fetch(`${API_URL}/create_quiz/question/${currentQuizId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questionText, options, correctAnswer, timeLimit, points })
        });

        const data = await res.json();
        if (data.content) {
            document.getElementById('add-question-form').reset();
            closeModal('add-question-modal');
            manageQuiz(currentQuizId);
        }
    } catch (err) {
        console.error('Add question failed', err);
    }
});

function renderQuestions(questions) {
    const container = document.getElementById('questions-container');
    container.innerHTML = '';

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <p style="color: var(--text-muted);">No questions added yet.</p>
            </div>
        `;
        return;
    }

    questions.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'glass-card animate-fade-in';
        card.style.padding = '1.5rem';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <h4 style="color: var(--text-primary);">Q${idx + 1}: ${q.questionText}</h4>
                <button class="btn btn-outline" style="padding: 0.3rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">🗑️</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
                ${q.options.map((opt, i) => `
                    <div style="padding: 0.5rem; border-radius: 8px; font-size: 0.85rem; border: 1px solid ${i === q.correctAnswer ? 'var(--primary)' : 'var(--glass-border)'}; background: ${i === q.correctAnswer ? 'rgba(139, 92, 246, 0.1)' : 'transparent'};">
                        ${opt} ${i === q.correctAnswer ? '✅' : ''}
                    </div>
                `).join('')}
            </div>
            <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-muted);">
                <span>⏱ ${q.timeLimit}s</span>
                <span>⭐ ${q.points} pts</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Initial Load
loadQuizzes();
