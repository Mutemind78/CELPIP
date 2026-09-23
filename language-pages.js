/* ==========================================================================
   SelfPIP — Language study pages: shared interactions
   Used by language-grammar.html, language-vocabulary.html,
   language-connectors.html, language-pronunciation.html
   (loaded after the shared script.js)
   --------------------------------------------------------------------------
   Nothing here touches other pages: every hook is namespaced with the
   data-lpn-* attribute prefix, the data-speak attribute, or the .lpn- class
   prefix.

   WHAT IT POWERS
   1. Expand / collapse topic cards                        -> .lpn-acc
   2. Multiple-choice "Fix the Sentence" / builder quizzes -> [data-lpn-quiz]
   3. "Click the incorrect part" exercises                 -> [data-lpn-parts]
   4. Speak buttons (Web Speech API, en-CA fallback chain) -> [data-speak]
        Word cards play Google-style: the word at normal pace, then slowly again.
        Sentence buttons (examples, patterns, paragraphs) play once, normal pace.
   5. Local-only practice textareas (localStorage)         -> [data-lpn-practice]
   6. Browser-only microphone recording (MediaRecorder)    -> [data-lpn-recorder]
   ========================================================================== */
(function () {
    'use strict';

    /* Locale preference: Canadian English first, then US, then UK.
       If none of these voices exist the utterance still runs with the
       browser's default voice (graceful fallback). */
    var LOCALE_CHAIN = ['en-CA', 'en-US', 'en-GB'];
    var voicesCache = [];

    /* Google-dictionary style word playback (vocabulary + pronunciation word
       cards): once at regular pace, then once slowly so the learner can copy
       how the word is said. */
    var WORD_NORMAL_RATE = 1.0;
    var WORD_SLOW_RATE = 0.5;
    var WORD_SLOW_PAUSE_MS = 400;
    /* Bumped on every new playback so stale chained utterances are dropped. */
    var speakSession = 0;

    /* ---------- Shared helpers ---------------------------------------- */

    function speechSupported() {
        return typeof window !== 'undefined' &&
            'speechSynthesis' in window &&
            typeof window.SpeechSynthesisUtterance !== 'undefined';
    }

    function cacheVoices() {
        if (!speechSupported()) { return; }
        try {
            voicesCache = window.speechSynthesis.getVoices() || [];
        } catch (e) {
            voicesCache = [];
        }
    }

    function pickVoice() {
        if (!voicesCache.length) { cacheVoices(); }
        if (!voicesCache.length) { return null; }
        var i, j, voice, lang;
        /* 1. Exact locale match along the chain */
        for (i = 0; i < LOCALE_CHAIN.length; i++) {
            for (j = 0; j < voicesCache.length; j++) {
                voice = voicesCache[j];
                lang = (voice.lang || '').replace('_', '-');
                if (lang && lang.toLowerCase() === LOCALE_CHAIN[i].toLowerCase()) {
                    return voice;
                }
            }
        }
        /* 2. Prefix match (e.g. en-CA-ON) along the same chain */
        for (i = 0; i < LOCALE_CHAIN.length; i++) {
            for (j = 0; j < voicesCache.length; j++) {
                voice = voicesCache[j];
                lang = (voice.lang || '').replace('_', '-').toLowerCase();
                if (lang && lang.indexOf(LOCALE_CHAIN[i].toLowerCase()) === 0) {
                    return voice;
                }
            }
        }
        /* 3. Any English voice */
        for (j = 0; j < voicesCache.length; j++) {
            voice = voicesCache[j];
            lang = (voice.lang || '').replace('_', '-').toLowerCase();
            if (lang && lang.indexOf('en') === 0) { return voice; }
        }
        return null;
    }

    function makeUtterance(text, rate, lang) {
        var utter = new SpeechSynthesisUtterance(text);
        var voice = pickVoice();
        if (voice) {
            utter.voice = voice;
            utter.lang = voice.lang;
        } else {
            /* Requested locale unavailable -> browser default voice. */
            utter.lang = lang || LOCALE_CHAIN[0];
        }
        utter.rate = rate;
        return utter;
    }

    function speak(text, opts) {
        if (!speechSupported() || !text) { return false; }
        opts = opts || {};
        try {
            speakSession += 1;
            window.speechSynthesis.cancel();
            var utter = makeUtterance(text, opts.rate || 0.95, opts.lang);
            /* Small delay: Chrome can drop an utterance queued right after cancel(). */
            window.setTimeout(function () {
                try { window.speechSynthesis.speak(utter); } catch (e) { /* no-op */ }
            }, 60);
            return true;
        } catch (e) {
            return false;
        }
    }

    /* Google-dictionary style word playback: the word once at regular pace,
       a short beat, then once more slowly so the learner can copy how it is
       said. speakSession invalidates the chained slow pass whenever the user
       starts another playback before this one finishes. */
    function speakWord(word) {
        if (!speechSupported() || !word) { return false; }
        try {
            var session = ++speakSession;
            window.speechSynthesis.cancel();
            var fast = makeUtterance(word, WORD_NORMAL_RATE);
            var slow = makeUtterance(word, WORD_SLOW_RATE);
            var slowQueued = false;
            function queueSlow() {
                if (slowQueued || session !== speakSession) { return; }
                slowQueued = true;
                window.setTimeout(function () {
                    if (session !== speakSession) { return; }
                    try { window.speechSynthesis.speak(slow); } catch (e) { /* no-op */ }
                }, WORD_SLOW_PAUSE_MS);
            }
            fast.onend = queueSlow;
            /* Safety net: a few browsers never fire onend. */
            window.setTimeout(queueSlow, 3000);
            /* Small delay: Chrome can drop an utterance queued right after cancel(). */
            window.setTimeout(function () {
                try { window.speechSynthesis.speak(fast); } catch (e) { /* no-op */ }
            }, 60);
            return true;
        } catch (e) {
            return false;
        }
    }

    /* ---------- 1. Expand / collapse cards ----------------------------- */

    function setAccordion(head, expanded) {
        var body = document.getElementById(head.getAttribute('aria-controls'));
        head.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (body) { body.hidden = !expanded; }
    }

    function initAccordions() {
        document.querySelectorAll('[data-lpn-acc-head]').forEach(function (head) {
            setAccordion(head, head.getAttribute('aria-expanded') === 'true');
            head.addEventListener('click', function () {
                setAccordion(head, head.getAttribute('aria-expanded') !== 'true');
            });
        });
    }

    function initAccordionControls() {
        document.querySelectorAll('[data-lpn-acc-control]').forEach(function (button) {
            button.addEventListener('click', function () {
                var group = button.getAttribute('data-lpn-acc-for');
                var shouldOpen = button.getAttribute('data-lpn-acc-control') === 'open';
                var scope = group
                    ? document.querySelectorAll('[data-lpn-acc-group="' + group + '"] [data-lpn-acc-head]')
                    : document.querySelectorAll('[data-lpn-acc-head]');
                scope.forEach(function (head) { setAccordion(head, shouldOpen); });
            });
        });
    }

    /* ---------- Shared feedback rendering ------------------------------ */

    function showFeedback(container, isCorrect, titleText, bodyText) {
        var feedback = container.querySelector('[data-lpn-feedback]');
        if (feedback) {
            var title = feedback.querySelector('[data-lpn-feedback-title]');
            var text = feedback.querySelector('[data-lpn-feedback-text]');
            if (title) { title.textContent = titleText; }
            if (text) { text.textContent = bodyText; }
            feedback.className = 'lpn-feedback ' + (isCorrect ? 'is-correct' : 'is-wrong');
            feedback.hidden = false;
        }
        var retry = container.querySelector('[data-lpn-retry]');
        if (retry) { retry.hidden = false; }
    }

    function resetFeedback(container) {
        var feedback = container.querySelector('[data-lpn-feedback]');
        if (feedback) { feedback.hidden = true; }
        var retry = container.querySelector('[data-lpn-retry]');
        if (retry) { retry.hidden = true; }
    }

    /* ---------- 2. Multiple-choice quizzes ----------------------------- */

    function answerQuiz(quiz, option) {
        if (quiz.getAttribute('data-answered') === 'true') { return; }

        var correctOption = quiz.querySelector('.lpn-option[data-lpn-correct="true"]');
        if (!correctOption) { return; }
        var isCorrect = option === correctOption;
        var correctLabel = correctOption.getAttribute('data-lpn-option') || '';
        var chosenLabel = option.getAttribute('data-lpn-option') || '';
        var explain = quiz.getAttribute('data-lpn-explain') || '';

        quiz.setAttribute('data-answered', 'true');
        quiz.querySelectorAll('.lpn-option').forEach(function (button) {
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

        var title = 'Correct: ' + correctLabel;
        var body = explain;
        if (!isCorrect) {
            title = 'Not quite — Correct: ' + correctLabel;
            var why = option.getAttribute('data-lpn-why');
            body = 'You chose ' + chosenLabel + '. ' + (why ? why + ' ' : '') + explain;
        }
        showFeedback(quiz, isCorrect, title, body);
    }

    function resetQuiz(quiz) {
        quiz.removeAttribute('data-answered');
        quiz.querySelectorAll('.lpn-option').forEach(function (button) {
            button.classList.remove('is-correct', 'is-wrong', 'is-dim');
            button.removeAttribute('aria-disabled');
        });
        resetFeedback(quiz);
    }

    function initQuizzes() {
        document.querySelectorAll('[data-lpn-quiz]').forEach(function (quiz) {
            quiz.addEventListener('click', function (event) {
                var option = event.target.closest('.lpn-option');
                if (option && quiz.contains(option)) { answerQuiz(quiz, option); return; }
                var retry = event.target.closest('[data-lpn-retry]');
                if (retry && quiz.contains(retry)) { resetQuiz(quiz); }
            });
        });
    }

    /* ---------- 3. "Click the incorrect part" exercises ----------------- */

    function answerParts(container, segment) {
        if (container.getAttribute('data-answered') === 'true') { return; }

        var correctSeg = container.querySelector('.lpn-seg[data-lpn-correct="true"]');
        if (!correctSeg) { return; }
        var isCorrect = segment === correctSeg;
        var explain = container.getAttribute('data-lpn-explain') || '';

        container.setAttribute('data-answered', 'true');
        container.querySelectorAll('.lpn-seg').forEach(function (seg) {
            seg.classList.remove('is-correct', 'is-wrong', 'is-dim');
            if (seg === correctSeg) {
                seg.classList.add('is-correct');
            } else if (seg === segment) {
                seg.classList.add('is-wrong');
            } else if (!isCorrect) {
                seg.classList.add('is-dim');
            }
            seg.setAttribute('aria-disabled', 'true');
        });

        if (isCorrect) {
            showFeedback(container, true, 'Correct: “' + correctSeg.textContent.trim() + '”', explain);
        } else {
            showFeedback(container, false,
                'Not quite — the incorrect part is “' + correctSeg.textContent.trim() + '”',
                explain);
        }
    }

    function resetParts(container) {
        container.removeAttribute('data-answered');
        container.querySelectorAll('.lpn-seg').forEach(function (seg) {
            seg.classList.remove('is-correct', 'is-wrong', 'is-dim');
            seg.removeAttribute('aria-disabled');
        });
        resetFeedback(container);
    }

    function initParts() {
        document.querySelectorAll('[data-lpn-parts]').forEach(function (container) {
            container.addEventListener('click', function (event) {
                var seg = event.target.closest('.lpn-seg');
                if (seg && container.contains(seg)) { answerParts(container, seg); return; }
                var retry = event.target.closest('[data-lpn-retry]');
                if (retry && container.contains(retry)) { resetParts(container); }
            });
        });
    }

    /* ---------- 4. Speak buttons (Web Speech API) ----------------------- */

    function setSpeakSupport(supported) {
        document.querySelectorAll('[data-speak]').forEach(function (button) {
            if (supported) {
                button.removeAttribute('disabled');
                button.removeAttribute('title');
            } else {
                button.setAttribute('disabled', 'disabled');
                button.setAttribute('title', 'Speech is not supported in this browser — read the text instead.');
            }
        });
    }

    function wordOfCard(card) {
        if (!card) { return ''; }
        var nameBtn = card.querySelector('.lpn-word-name');
        if (!nameBtn) { return ''; }
        return (nameBtn.getAttribute('data-speak') || nameBtn.textContent || '').trim();
    }

    function wireSpeak() {
        setSpeakSupport(speechSupported());
        document.addEventListener('click', function (event) {
            var button = event.target.closest('[data-speak]');
            if (!button || button.hasAttribute('disabled')) { return; }
            var text = button.getAttribute('data-speak');
            if (!text) { return; }

            /* Word cards teach the word itself, Google-style: normal, then slow.
               data-speak-mode="sentence" opts a button out of that behaviour. */
            var mode = button.getAttribute('data-speak-mode');
            var isWordName = button.classList.contains('lpn-word-name');
            var card = button.closest('.lpn-word');
            if (!mode && (isWordName || (card && button.classList.contains('lpn-speak')))) {
                mode = 'word';
            }
            if (mode === 'word') {
                var word = isWordName ? text : wordOfCard(card);
                if (word) { speakWord(word); return; }
            }
            speak(text);
        });
    }

    /* Word cards: the head 🔊 teaches the word (normal + slow), so the example
       sentence gets its own small play button on the Example row. */
    function initWordCards() {
        document.querySelectorAll('.lpn-word').forEach(function (card) {
            var word = wordOfCard(card);
            if (word) {
                card.querySelectorAll('.lpn-word-head .lpn-speak').forEach(function (btn) {
                    btn.setAttribute('aria-label', 'Hear the word ' + word + ' at normal speed, then slowly');
                });
            }
            card.querySelectorAll('.lpn-wrow').forEach(function (row) {
                var label = row.querySelector('.lpn-wlabel');
                if (!label || (label.textContent || '').trim() !== 'Example') { return; }
                if (row.querySelector('[data-speak]')) { return; }
                var sentence = '';
                var sib = label.nextSibling;
                while (sib) { sentence += sib.textContent || ''; sib = sib.nextSibling; }
                sentence = sentence.trim();
                if (!sentence) { return; }
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'lpn-speak lpn-speak-sm lpn-speak--ghost lpn-wrow-play';
                btn.setAttribute('data-speak', sentence);
                btn.setAttribute('data-speak-mode', 'sentence');
                btn.setAttribute('aria-label', word ? 'Hear an example sentence with ' + word : 'Hear the example sentence');
                btn.textContent = '🔊';
                row.appendChild(btn);
            });
        });
    }

    function wireVoices() {
        if (!speechSupported()) { return; }
        if (typeof window.speechSynthesis !== 'undefined' && 'onvoiceschanged' in window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = function () {
                cacheVoices();
            };
        }
    }

    /* ---------- 5. Practice textareas saved locally --------------------- */

    function initPractice() {
        document.querySelectorAll('[data-lpn-practice]').forEach(function (field) {
            var area = field.querySelector('textarea');
            if (!area) { return; }
            var key = 'selfpip-practice-' + field.getAttribute('data-lpn-practice');
            try {
                var saved = localStorage.getItem(key);
                if (saved) { area.value = saved; }
            } catch (err) { /* storage unavailable */ }
            area.addEventListener('input', function () {
                try { localStorage.setItem(key, area.value); } catch (err) { /* ignore */ }
            });
        });
    }

    /* ---------- 6. Audio recorder (Hear → Repeat → Record) --------------- */

    function initRecorders() {
        var recorderSupported = typeof window !== 'undefined' &&
            !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) &&
            typeof window.MediaRecorder !== 'undefined';
        if (!recorderSupported) {
            document.querySelectorAll('[data-lpn-recorder]').forEach(function (rec) {
                rec.setAttribute('hidden', 'hidden');
            });
            return;
        }
        var mime = '';
        if (typeof MediaRecorder.isTypeSupported === 'function') {
            ['audio/webm', 'audio/mp4', 'audio/ogg'].some(function (type) {
                if (MediaRecorder.isTypeSupported(type)) { mime = type; return true; }
                return false;
            });
        }

        document.querySelectorAll('[data-lpn-recorder]').forEach(function (rec) {
            var startBtn = rec.querySelector('[data-lpn-rec-start]');
            var stopBtn = rec.querySelector('[data-lpn-rec-stop]');
            var status = rec.querySelector('[data-lpn-rec-status]');
            var audio = rec.querySelector('[data-lpn-rec-audio]');
            var mediaRecorder = null;
            var stream = null;
            var chunks = [];
            var objectUrl = null;

            function setStatus(text, live) {
                if (status) {
                    status.textContent = text;
                    status.classList.toggle('is-live', !!live);
                }
            }
            function releaseStream() {
                if (stream) {
                    stream.getTracks().forEach(function (track) { track.stop(); });
                    stream = null;
                }
            }
            if (startBtn) {
                startBtn.addEventListener('click', function () {
                    if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
                    chunks = [];
                    if (audio) { audio.removeAttribute('src'); audio.hidden = true; }
                    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
                        stream = s;
                        mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
                        mediaRecorder.addEventListener('dataavailable', function (e) {
                            if (e.data && e.data.size) { chunks.push(e.data); }
                        });
                        mediaRecorder.addEventListener('stop', function () {
                            if (chunks.length && audio) {
                                objectUrl = URL.createObjectURL(new Blob(chunks, { type: mime || 'audio/webm' }));
                                audio.src = objectUrl;
                                audio.hidden = false;
                            }
                            setStatus('Playback ready — compare your voice with the 🔊 model.', false);
                            if (startBtn) { startBtn.hidden = false; startBtn.disabled = false; }
                            releaseStream();
                        });
                        mediaRecorder.start();
                        if (startBtn) { startBtn.hidden = true; }
                        if (stopBtn) { stopBtn.hidden = false; }
                        setStatus('Recording… press Stop when you are done.', true);
                    }).catch(function () {
                        setStatus('Microphone unavailable — allow mic access or skip this step.', false);
                        if (startBtn) { startBtn.disabled = false; startBtn.hidden = false; }
                        if (stopBtn) { stopBtn.hidden = true; }
                    });
                });
            }
            if (stopBtn) {
                stopBtn.addEventListener('click', function () {
                    if (mediaRecorder && mediaRecorder.state === 'recording') { mediaRecorder.stop(); }
                    stopBtn.hidden = true;
                    setStatus('Processing recording…', false);
                });
            }
        });
    }

    /* ---------- Init ----------------------------------------------------- */

    document.addEventListener('DOMContentLoaded', function () {
        initAccordions();
        initAccordionControls();
        initQuizzes();
        initParts();
        initWordCards();
        wireSpeak();
        wireVoices();
        initPractice();
        initRecorders();
    });

})();





