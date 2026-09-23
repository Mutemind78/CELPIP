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



/* ---------- Generic interactive checklists ------------------------------
   Markup: wrapper [data-checklist="NAME"] around input[type=checkbox]
   Bar:    [data-check-count="NAME"] span + [data-check-clear="NAME"] button
   State persists in localStorage; count reads "N unchecked".               */
(function () {
    'use strict';
    function initChecklist(wrap) {
        var name = wrap.getAttribute('data-checklist');
        if (!name) return;
        var boxes = wrap.querySelectorAll('input[type="checkbox"]');
        if (!boxes.length) return;
        var key = 'selfpip-checklist-' + name;
        var countEl = document.querySelector('[data-check-count="' + name + '"]');
        var clearEl = document.querySelector('[data-check-clear="' + name + '"]');
        var saved = [];
        try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch (e) { saved = []; }
        var i;
        for (i = 0; i < boxes.length; i++) { boxes[i].checked = saved[i] === true; }
        function refresh() {
            if (!countEl) return;
            var unchecked = 0;
            var j;
            for (j = 0; j < boxes.length; j++) { if (!boxes[j].checked) unchecked++; }
            countEl.textContent = unchecked + ' unchecked';
        }
        function persist() {
            var state = [];
            var j;
            for (j = 0; j < boxes.length; j++) { state.push(!!boxes[j].checked); }
            try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* private mode */ }
            refresh();
        }
        for (i = 0; i < boxes.length; i++) { boxes[i].addEventListener('change', persist); }
        if (clearEl) clearEl.addEventListener('click', function () {
            var j;
            for (j = 0; j < boxes.length; j++) { boxes[j].checked = false; }
            persist();
        });
        refresh();
    }
    document.querySelectorAll('[data-checklist]').forEach(initChecklist);
})();