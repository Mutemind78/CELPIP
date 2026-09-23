/* SelfPIP — CELPIP Writing task-page interactions (shared by writing-task-1/2.html) */
/* Hooks use data-wp-* so nothing leaks to Reading/Listening. */
(function () {
  'use strict';

  // ---------- Accordion sections (wp-acc / details) ----------
  function runAccordions() {
    const groups = document.querySelectorAll('[data-wp-acc-group]');
    groups.forEach(function (group) {
      const headers = group.querySelectorAll('[data-wp-acc-toggle]');
      headers.forEach(function (h) {
        h.addEventListener('click', function () {
          const id = h.getAttribute('aria-controls');
          const panel = id ? document.getElementById(id) : null;
          if (!panel) return;
          const open = panel.getAttribute('hidden') === null ? false : true;
          panel.toggleAttribute('hidden');
          h.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      });
    });
    const oa = document.querySelector('[data-wp-acc-open-all]');
    const ca = document.querySelector('[data-wp-acc-close-all]');
    const panels = document.querySelectorAll('[data-wp-acc-panel]');
    if (oa) oa.addEventListener('click', function () { panels.forEach(function (p) { p.removeAttribute('hidden'); }); });
    if (ca) ca.addEventListener('click', function () { panels.forEach(function (p) { p.setAttribute('hidden', ''); }); });
  }

  // ---------- Checklist (wp-checklist) ----------
  function runChecklists() {
    const lists = document.querySelectorAll('[data-wp-checklist]');
    lists.forEach(function (list) {
      const inputs = list.querySelectorAll('input[type="checkbox"]');
      const countEl = list.parentElement.querySelector('[data-wp-check-count]');
      const clearBtn = list.parentElement.querySelector('[data-wp-clear-checklist]');

      function update() {
        const n = Array.prototype.reduce.call(inputs, function (s, c) { return s + (c.checked ? 1 : 0); }, 0);
        if (countEl) countEl.textContent = n + (n === 0 ? ' unchecked' : ' checked');
        if (clearBtn) clearBtn.style.display = n > 0 ? '' : 'none';
      }
      inputs.forEach(function (c) { c.addEventListener('change', update); });
      if (clearBtn) { clearBtn.addEventListener('click', function () { inputs.forEach(function (c) { c.checked = false; }); update(); }); update(); }
    });
  }

  // ---------- Interactive quizzes (wp-quiz) ----------
  function runQuizzes() {
    const quizzes = document.querySelectorAll('[data-wp-quiz]');
    quizzes.forEach(function (quiz) {
      const name = quiz.getAttribute('data-wp-name') || '';
      const options = quiz.querySelectorAll('[data-wp-option]');
      const feedback = quiz.querySelector('[data-wp-feedback]');
      const retryBtn = quiz.querySelector('[data-wp-retry]');
      const titleEl = quiz.querySelector('[data-wp-feedback-title]');
      const textEl = quiz.querySelector('[data-wp-feedback-text]');
      const temptingEl = quiz.querySelector('[data-wp-feedback-tempting]');
      let locked = false;

      options.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (locked) return;
          const chosen = btn.getAttribute('data-wp-option');
          const correct = btn.getAttribute('data-wp-correct');
          const isCorrect = correct === 'true';
          const picked = chosen;

          options.forEach(function (o) {
            const oc = o.getAttribute('data-wp-option') === picked;
            o.setAttribute('data-wp-wrong', oc && !isCorrect ? 'true' : 'false');
            o.setAttribute('data-wp-dim', o.getAttribute('data-wp-option') !== picked && !oc ? 'true' : 'false');
            if (oc && isCorrect) o.setAttribute('data-wp-correct', 'true');
            if (oc && !isCorrect) o.setAttribute('data-wp-wrong', 'true');
            o.setAttribute('data-wp-disabled', 'true');
          });

          locked = true;
          if (titleEl) titleEl.textContent = isCorrect ? 'Correct.' : 'Not quite — review the explanation.';
          if (textEl) {
            textEl.textContent = btn.getAttribute('data-wp-explain') || btn.getAttribute('data-wp-why') || '';
          }
          if (temptingEl) {
            // Show tempting explanation only when user picked a wrong option (to explain the distractor)
            const allWrong = Array.prototype.filter.call(options, function (o) { return o.getAttribute('data-wp-option') !== picked && o.getAttribute('data-wp-why'); });
            if (allWrong.length) {
              temptingEl.textContent = 'Why the tempting option is wrong: ' + allWrong[0].getAttribute('data-wp-why');
              temptingEl.removeAttribute('hidden');
            } else {
              temptingEl.setAttribute('hidden', '');
            }
          }
          if (feedback) feedback.removeAttribute('hidden');
          if (retryBtn) retryBtn.style.display = '';
        });
      });

      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          locked = false;
          options.forEach(function (o) {
            o.removeAttribute('data-wp-wrong');
            o.removeAttribute('data-wp-dim');
            o.removeAttribute('data-wp-correct');
            o.removeAttribute('data-wp-disabled');
            o.style.opacity = '';
          });
          if (feedback) feedback.setAttribute('hidden', '');
          if (titleEl) titleEl.textContent = '';
          if (textEl) textEl.textContent = '';
          if (temptingEl) temptingEl.setAttribute('hidden', '');
          if (retryBtn) retryBtn.style.display = 'none';
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      runAccordions(); runChecklists(); runQuizzes();
    });
  } else {
    runAccordions(); runChecklists(); runQuizzes();
  }
})();
