// Load saved state from localStorage on startup
document.addEventListener("DOMContentLoaded", () => {
    loadTheme();
});

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.classList.toggle('open');
    }
}

/* ---------- Theme: header toggle (☀ / 🌙), persisted in localStorage ---------- */
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    const dark = theme === 'dark';
    document.querySelectorAll('.nav-theme, #themeToggleBtn').forEach((btn) => {
        btn.textContent = dark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    });
}

function toggleTheme() {
    const next = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('celpip_theme', next); } catch (e) { /* storage unavailable */ }
    applyTheme(next);
}

function loadTheme() {
    let saved = null;
    try { saved = localStorage.getItem('celpip_theme'); } catch (e) { /* storage unavailable */ }
    applyTheme(saved === 'dark' ? 'dark' : 'light');
}
