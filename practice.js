/* SelfPIP — Practice page interactions. Original content only. */
(function () {
    'use strict';

    var REVIEW_KEY = 'selfpip-practice-review-response';
    var questions = [
        {
            prompt: 'Which sentence is the clearest way to ask for a deadline in a formal email?',
            options: ['Could you maybe send it whenever convenient.', 'Please send your response by 3:00 p.m. on Friday.', 'You already know Friday is the important day.'],
            correct: 1,
            explanation: 'The best sentence names the requested action, the exact deadline, and an appropriate formal tone.'
        },
        {
            prompt: 'Choose the connector that shows a contrast.',
            context: 'The route was closed. ___, we arrived on time.',
            options: ['However', 'Therefore', 'For example'],
            correct: 0,
            explanation: '“However” signals contrast: the route was closed, but the result was still on time.'
        },
        {
            prompt: 'Choose the most precise verb.',
            context: 'The scientist ___ the results carefully before publishing them.',
            options: ['analyzed', 'glanced', 'ignored'],
            correct: 0,
            explanation: '“Analyzed” matches the careful action before publication. “Glanced” suggests a quick look, while “ignored” changes the meaning.'
        }
    ];

    function countWords(text) {
        var trimmed = text.trim();
        if (!trimmed) { return 0; }
        if (window.Intl && Intl.Segmenter) {
            var words = new Intl.Segmenter('en', { granularity: 'word' });
            return Array.from(words.segment(trimmed)).filter(function (part) {
                return part.isWordLike;
            }).length;
        }
        return (trimmed.match(/[^\s]+/g) || []).length;
    }

    function countSentences(text) {
        var trimmed = text.trim();
        if (!trimmed) { return 0; }
        if (window.Intl && Intl.Segmenter) {
            var sentences = new Intl.Segmenter('en', { granularity: 'sentence' });
            return Array.from(sentences.segment(trimmed)).filter(function (part) {
                return part.segment.trim();
            }).length;
        }
        var marked = trimmed.replace(/[.!?]+(?=\s|$)/g, '|');
        return marked.split('|').filter(function (part) { return part.trim(); }).length;
    }

    function initReview() {
        var review = document.querySelector('[data-pr-review]');
        if (!review) { return; }
        var area = review.querySelector('[data-pr-area]');
        var wordsOut = review.querySelector('[data-pr-words]');
        var sentencesOut = review.querySelector('[data-pr-sentences]');
        var criteriaOut = review.querySelector('[data-pr-criteria]');
        var criteriaStat = criteriaOut.closest('li');
        var status = review.querySelector('[data-pr-review-status]');
        var announcement = review.querySelector('[data-pr-review-announcement]');
        var clearResponse = review.querySelector('[data-pr-clear-response]');
        var clearChecklist = review.querySelector('[data-check-clear="review"]');
        var boxes = Array.prototype.slice.call(review.querySelectorAll('[data-checklist="review"] input'));
        var saveTimer;

        try { area.value = localStorage.getItem(REVIEW_KEY) || ''; } catch (error) { /* storage unavailable */ }

        function update(announce) {
            var words = countWords(area.value);
            var sentences = countSentences(area.value);
            var met = boxes.filter(function (box) { return box.checked; }).length;
            wordsOut.textContent = String(words);
            sentencesOut.textContent = String(sentences);
            criteriaOut.textContent = met + ' of ' + boxes.length;
            criteriaStat.classList.toggle('is-complete', boxes.length > 0 && met === boxes.length);
            status.textContent = area.value.trim()
                ? 'Local estimates only — nothing has been scored or uploaded.'
                : 'Start typing or paste a response to see your local counts.';
            if (announce) {
                announcement.textContent = words + ' words, about ' + sentences +
                    ' sentences, and ' + met + ' of ' + boxes.length + ' criteria met.';
            }
        }

        area.addEventListener('input', function () {
            update(false);
            window.clearTimeout(saveTimer);
            saveTimer = window.setTimeout(function () {
                try { localStorage.setItem(REVIEW_KEY, area.value); } catch (error) { /* storage unavailable */ }
            }, 180);
        });
        review.addEventListener('change', function (event) {
            if (event.target.matches('[data-checklist="review"] input')) { update(true); }
        });
        if (clearChecklist) {
            clearChecklist.addEventListener('click', function () {
                window.setTimeout(function () { update(true); }, 0);
            });
        }
        if (clearResponse) {
            clearResponse.addEventListener('click', function () {
                area.value = '';
                try { localStorage.removeItem(REVIEW_KEY); } catch (error) { /* storage unavailable */ }
                update(true);
                area.focus();
            });
        }
        update(false);
    }

    function initQuickPractice() {
        var quiz = document.querySelector('[data-pr-quiz]');
        if (!quiz) { return; }
        var prompt = quiz.querySelector('[data-pr-prompt]');
        var options = quiz.querySelector('[data-pr-options]');
        var feedback = quiz.querySelector('[data-pr-feedback]');
        var feedbackTitle = quiz.querySelector('[data-pr-title]');
        var feedbackText = quiz.querySelector('[data-pr-text]');
        var score = quiz.querySelector('[data-pr-score]');
        var next = quiz.querySelector('[data-pr-next]');
        var current = 0;
        var points = 0;
        var answered = false;

        function render() {
            var question = questions[current];
            prompt.textContent = question.prompt + (question.context ? ' ' + question.context : '');
            options.textContent = '';
            question.options.forEach(function (label, index) {
                var button = document.createElement('button');
                var key = document.createElement('span');
                var text = document.createElement('span');
                button.type = 'button';
                button.className = 'quiz-option';
                button.dataset.prOption = String(index);
                key.className = 'quiz-option-key';
                key.textContent = String.fromCharCode(65 + index);
                text.textContent = label;
                button.appendChild(key);
                button.appendChild(text);
                options.appendChild(button);
            });
            feedback.hidden = true;
            feedback.className = 'quiz-feedback';
            feedbackTitle.textContent = '';
            feedbackText.textContent = '';
            score.textContent = 'Question ' + (current + 1) + ' of ' + questions.length;
            next.disabled = true;
            next.textContent = current === questions.length - 1 ? 'Finish' : 'Next question';
            answered = false;
        }

        options.addEventListener('click', function (event) {
            if (answered) { return; }
            var button = event.target.closest('[data-pr-option]');
            if (!button) { return; }
            answered = true;
            var choice = Number(button.dataset.prOption);
            var correct = choice === questions[current].correct;
            options.querySelectorAll('[data-pr-option]').forEach(function (option) {
                var isCorrect = Number(option.dataset.prOption) === questions[current].correct;
                option.disabled = true;
                option.dataset.state = isCorrect ? 'correct' : (option === button ? 'wrong' : 'muted');
            });
            feedbackTitle.textContent = correct ? 'Correct.' : 'Not quite — read the explanation.';
            feedbackText.textContent = questions[current].explanation;
            feedback.className = 'quiz-feedback quiz-feedback--' + (correct ? 'correct' : 'wrong');
            feedback.hidden = false;
            if (correct) { points += 1; }
            score.textContent = 'Score: ' + points + ' / ' + questions.length +
                ' — question ' + (current + 1) + ' of ' + questions.length;
            next.disabled = false;
        });

        next.addEventListener('click', function () {
            if (!answered) { return; }
            if (current < questions.length - 1) {
                current += 1;
            } else {
                current = 0;
                points = 0;
            }
            render();
        });
        render();
    }

    function boot() {
        initReview();
        initQuickPractice();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
