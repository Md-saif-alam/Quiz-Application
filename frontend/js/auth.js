// Authentication & Auth UI Logic (Updated for current backend)

const API_BASE = `https://quiz-application-qu0q.onrender.com`;

// --- Auth Toggle & UI ---

function openAuth(type) {
    const overlay = document.getElementById('auth-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    switchAuth(type);
}

function closeAuth() {
    const overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.style.display = 'none';
}

function switchAuth(type) {
    const loginSec = document.getElementById('login-section');
    const regSec = document.getElementById('register-section');
    const errorEl = document.getElementById('auth-error');

    if (errorEl) errorEl.style.display = 'none';

    if (type === 'login') {
        loginSec.classList.remove('hidden');
        regSec.classList.add('hidden');
    } else {
        loginSec.classList.add('hidden');
        regSec.classList.remove('hidden');
    }
}

// --- Admin Login Flow ---
// Note: Backend /api/admin_login currently creates a hardcoded admin
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('auth-error');
    if (errorEl) errorEl.style.display = 'none';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/admin_login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Store the user and token returned by the backend
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
            window.location.href = 'admin-dashboard.html';
        } else {
            showAuthError(data.message || 'Admin access failed.');
        }
    } catch (err) {
        showAuthError('Connection failed.');
    }
});

function showAuthError(msg) {
    const errorEl = document.getElementById('auth-error');
    if (!errorEl) return;
    errorEl.innerText = msg;
    errorEl.style.display = 'block';
}

// --- Student Join Flow ---

async function handleJoin() {
    const codeInput = document.getElementById('join-code');
    const code = codeInput.value.trim().toUpperCase();
    if (!code) return;

    // In this version, we don't force login before checking code.
    // We just show the name entry if the code might be valid.
    localStorage.setItem('pendingJoinCode', code);
    document.getElementById('name-overlay').style.display = 'flex';
}

async function confirmJoin() {
    const username = document.getElementById('student-name').value.trim();
    const joinCode = localStorage.getItem('pendingJoinCode');

    if (!username) {
        alert('Please enter your name');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, joinCode })
        });

        const data = await res.json();
        if (res.ok) {
            // Backend returns: { message, user, quizId, joinCode }
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = `quiz-room.html?code=${data.joinCode}&quizId=${data.quizId}`;
        } else {
            alert(data.message || 'Failed to join quiz');
        }
    } catch (err) {
        showJoinError('Server connection failed');
    }
}

function showJoinError(msg) {
    const el = document.getElementById('join-error');
    if (!el) return;
    el.innerText = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 3000);
}
