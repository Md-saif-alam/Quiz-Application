// Theme toggling logic
document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;

    // Apply initial icon state
    const currentTheme = localStorage.getItem('theme') || 'dark';
    themeBtn.innerText = currentTheme === 'light' ? '🌙' : '☀️';

    themeBtn.addEventListener('click', () => {
        const root = document.documentElement;
        if (root.classList.contains('light-theme')) {
            // Switch to dark
            root.classList.remove('light-theme');
            localStorage.setItem('theme', 'dark');
            themeBtn.innerText = '☀️';
        } else {
            // Switch to light
            root.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
            themeBtn.innerText = '🌙';
        }
    });
});
