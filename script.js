// Load saved state from localStorage on startup
document.addEventListener("DOMContentLoaded", () => {
    loadProgress();
    loadTheme();
});

function toggleMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.classList.toggle('open');
    }
}

function toggleCardMaster(cardId) {
    const card = document.getElementById(`card-${cardId}`);
    if (!card) return;
    const checkbox = card.querySelector('.card-master-toggle input');
    if (!checkbox) return;
    
    if (checkbox.checked) {
        card.classList.add('mastered');
    } else {
        card.classList.remove('mastered');
    }
    saveProgress();
    updateProgressBar();
}

function updateProgressBar() {
    const totalCards = 10;
    const masteredCards = document.querySelectorAll('.card.mastered').length;
    const percentage = (masteredCards / totalCards) * 100;
    
    const fill = document.getElementById('progressBarFill');
    const text = document.getElementById('progressText');
    if (fill) fill.style.width = percentage + '%';
    if (text) text.textContent = `${masteredCards} / ${totalCards} Cards Mastered`;
}

function updateChecklistProgress() {
    // Handle visual line-through on click for checklist items
    setTimeout(() => {
        document.querySelectorAll('.check-item').forEach(item => {
            const cb = item.querySelector('input');
            if (cb.checked) {
                item.classList.add('completed');
            } else {
                item.classList.remove('completed');
            }
        });
        saveProgress();
    }, 50);
}

function saveProgress() {
    const cardStates = {};
    for (let i = 0; i < 10; i++) {
        const card = document.getElementById(`card-${i}`);
        if (card) {
            const cb = card.querySelector('.card-master-toggle input');
            cardStates[i] = cb ? cb.checked : false;
        }
    }

    const checklistStates = [];
    document.querySelectorAll('.task-checkbox').forEach((cb, index) => {
        checklistStates[index] = cb.checked;
    });

    localStorage.setItem('celpip_card_states', JSON.stringify(cardStates));
    localStorage.setItem('celpip_checklist_states', JSON.stringify(checklistStates));
}

function loadProgress() {
    const savedCards = localStorage.getItem('celpip_card_states');
    if (savedCards) {
        const cardStates = JSON.parse(savedCards);
        for (let i = 0; i < 10; i++) {
            if (cardStates[i]) {
                const card = document.getElementById(`card-${i}`);
                if (card) {
                    const cb = card.querySelector('.card-master-toggle input');
                    if (cb) {
                        cb.checked = true;
                        card.classList.add('mastered');
                    }
                }
            }
        }
        updateProgressBar();
    }

    const savedChecklist = localStorage.getItem('celpip_checklist_states');
    if (savedChecklist) {
        const checklistStates = JSON.parse(savedChecklist);
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach((cb, index) => {
            if (checklistStates[index]) {
                cb.checked = true;
                const checkItem = cb.closest('.check-item');
                if (checkItem) checkItem.classList.add('completed');
            }
        });
    }
}

function resetProgress() {
    if (confirm("Are you sure you want to reset all your study progress and checklist items?")) {
        localStorage.removeItem('celpip_card_states');
        localStorage.removeItem('celpip_checklist_states');
        for (let i = 0; i < 10; i++) {
            const card = document.getElementById(`card-${i}`);
            if (card) {
                const cb = card.querySelector('.card-master-toggle input');
                if (cb) cb.checked = false;
                card.classList.remove('mastered');
            }
        }
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.checked = false;
            const checkItem = cb.closest('.check-item');
            if (checkItem) checkItem.classList.remove('completed');
        });
        updateProgressBar();
    }
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeToggleBtn');
    if (body.getAttribute('data-theme') === 'light') {
        body.setAttribute('data-theme', 'dark');
        if (btn) btn.textContent = '☀️ Light Mode';
        localStorage.setItem('celpip_theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        if (btn) btn.textContent = '🌙 Dark Mode';
        localStorage.setItem('celpip_theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('celpip_theme');
    const btn = document.getElementById('themeToggleBtn');
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        if (btn) btn.textContent = '☀️ Light Mode';
    }
}
