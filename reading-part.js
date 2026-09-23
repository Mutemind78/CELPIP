/* ==========================================================================
   SelfPIP — Reading study pages: shared interactions
   Used by reading-part-1.html ... reading-part-4.html
   (loaded after the shared script.js)
   --------------------------------------------------------------------------
   Nothing here touches other pages: every hook is namespaced with the
   data-rp1-* attribute prefix or the .rp1- class prefix.

   WHAT IT POWERS
   1. Expand / collapse cards (question types, phases, examples)    -> .rp1-acc
   2. "Open all" / "Close all" controls inside one group            -> data-rp1-acc-control
   3. Interactive mini-example answers with feedback                -> data-rp1-quiz
   4. Reading checklists with counter                               -> .rp1Checklist
   ========================================================================== */
(function () {
    'use strict';

    /* ---------- 1 & 2. Expand / collapse cards ------------------------- */

    function setAccordion(head, expanded) {
        var body = document.getElementById(head.getAttribute('aria-controls'));
        head.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (body) { body.hidden = !expanded; }
    }

    function initAccordions() {
        document.querySelectorAll('[data-rp1-acc-head]').forEach(function (head) {
            setAccordion(head, head.getAttribute('aria-expanded') === 'true');
            head.addEventListener('click', function () {
                setAccordion(head, head.getAttribute('aria-expanded') !== 'true');
            });
        });
    }

    function initAccordionControls() {
        document.querySelectorAll('[data-rp1-acc-control]').forEach(function (button) {
            button.addEventListener('click', function () {
                var group = button.getAttribute('data-rp1-acc-for');
                var shouldOpen = button.getAttribute('data-rp1-acc-control') === 'open';
                var scope = group
                    ? document.querySelectorAll('[data-rp1-acc-group="' + group + '"] [data-rp1-acc-head]')
                    : document.querySelectorAll('[data-rp1-acc-head]');
                scope.forEach(function (head) { setAccordion(head, shouldOpen); });
            });
        });
    }

    /* ---------- 3. Mini-example questions ------------------------------ */

    function answerQuestion(quiz, option) {
        if (quiz.getAttribute('data-answered') === 'true') { return; }

        var correctOption = quiz.querySelector('.rp1-option[data-rp1-correct="true"]');
        var temptingOption = quiz.querySelector('.rp1-option[data-rp1-tempting="true"]');
        var isCorrect = option === correctOption;

        quiz.setAttribute('data-answered', 'true');
        quiz.querySelectorAll('.rp1-option').forEach(function (button) {
            button.classList.remove('is-correct', 'is-wrong', 'is-dim');
            if (button === correctOption) {
                button.classList.add('is-correct');
            } else if (button === option) {
                button.classList.add('is-wrong');
            } else {
                button.classList.add('is-dim');
            }
            button.setAttribute('aria-disabled', 'true');
        });

        var feedback = quiz.querySelector('[data-rp1-feedback]');
        if (feedback) {
            var heading = feedback.querySelector('[data-rp1-feedback-title]');
            var text = feedback.querySelector('[data-rp1-feedback-text]');
            var tempting = feedback.querySelector('[data-rp1-feedback-tempting]');
            var letter = correctOption ? correctOption.getAttribute('data-rp1-option') : '';
            var explain = correctOption ? (correctOption.getAttribute('data-rp1-explain') || '') : '';

            if (heading) {
                heading.textContent = isCorrect ? '✅ Correct' : '❌ Not quite';
            }
            /* Why the best answer is supported by the passage. */
            if (text) {
                text.textContent = isCorrect
                    ? explain
                    : 'The best answer is ' + letter + '. ' + explain;
            }
            /* Why the other choice was not the best one (or why the tempting
               option is a trap when the learner answered correctly). */
            if (tempting) {
                if (isCorrect && temptingOption) {
                    tempting.textContent = 'Tempting wrong answer — ' + temptingOption.getAttribute('data-rp1-option') + ': ' +
                        (temptingOption.getAttribute('data-rp1-why') || '');
                } else if (!isCorrect) {
                    tempting.textContent = 'Why your choice (' + option.getAttribute('data-rp1-option') + ') is not the best: ' +
                        (option.getAttribute('data-rp1-why') || '');
                }
                tempting.hidden = false;
            }
            feedback.hidden = false;
            feedback.className = 'rp1-feedback ' + (isCorrect ? 'is-correct' : 'is-wrong');
        }

        var retry = quiz.querySelector('[data-rp1-retry]');
        if (retry) { retry.hidden = false; }
    }

    function resetQuestion(quiz) {
        quiz.removeAttribute('data-answered');
        quiz.querySelectorAll('.rp1-option').forEach(function (button) {
            button.classList.remove('is-correct', 'is-wrong', 'is-dim');
            button.removeAttribute('aria-disabled');
        });
        var feedback = quiz.querySelector('[data-rp1-feedback]');
        if (feedback) { feedback.hidden = true; }
        var tempting = quiz.querySelector('[data-rp1-feedback-tempting]');
        if (tempting) { tempting.hidden = true; }
        var retry = quiz.querySelector('[data-rp1-retry]');
        if (retry) { retry.hidden = true; }
    }

    function initQuizzes() {
        document.querySelectorAll('[data-rp1-quiz]').forEach(function (quiz) {
            quiz.addEventListener('click', function (event) {
                var option = event.target.closest('.rp1-option');
                if (option && quiz.contains(option)) { answerQuestion(quiz, option); return; }
                var retry = event.target.closest('[data-rp1-retry]');
                if (retry && quiz.contains(retry)) { resetQuestion(quiz); }
            });
        });
    }
    /* ---------- 4. Quick checklist ------------------------------------ */

    function updateChecklistCount() {
        var list = document.getElementById('rp1Checklist');
        var counter = document.querySelector('[data-rp1-check-count]');
        if (!list || !counter) { return; }
        var boxes = list.querySelectorAll('input[type="checkbox"]');
        var checked = 0;
        boxes.forEach(function (box) { if (box.checked) { checked += 1; } });
        counter.textContent = checked + ' of ' + boxes.length + ' checked';
    }

    function initChecklist() {
        var list = document.getElementById('rp1Checklist');
        if (!list) { return; }

        list.addEventListener('change', function (event) {
            var box = event.target.closest('input[type="checkbox"]');
            if (!box) { return; }
            var item = box.closest('.rp1-check');
            if (item) { item.classList.toggle('is-done', box.checked); }
            updateChecklistCount();
        });

        var clear = document.querySelector('[data-rp1-clear-checklist]');
        if (clear) {
            clear.addEventListener('click', function () {
                list.querySelectorAll('input[type="checkbox"]').forEach(function (box) {
                    box.checked = false;
                    var item = box.closest('.rp1-check');
                    if (item) { item.classList.remove('is-done'); }
                });
                updateChecklistCount();
            });
        }

        updateChecklistCount();
    }

    /* ---------- Boot --------------------------------------------------- */

    document.addEventListener('DOMContentLoaded', function () {
        initAccordions();
        initAccordionControls();
        initQuizzes();
        initChecklist();
    });
})();
