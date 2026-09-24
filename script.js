/* SelfPIP — shared interface script (every page)
   ---------------------------------------------------------------------------
   Owns the pieces of behaviour that belong to the whole site:
     1. theme (light / dark) with the header toggle
     2. mobile navigation
     3. sticky-header shadow on scroll
     4. scroll progress bar (long pages only)
     5. back-to-top button
     6. reveal-on-scroll for sections
     7. subtle desktop cursor ring
     8. footer year
     9. generic checklists ([data-checklist="name"])

   Section pages load their own script after this one (listening-part.js,
   reading-part.js, writing-part.js, speaking-task.js, language-pages.js);
   those files keep their own data-* hooks and are not touched here.
   --------------------------------------------------------------------------- */

(function () {
    'use strict';

    var THEME_KEY = 'celpip_theme';
    var root = document.documentElement;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    /* ------------------------------------------------------------------ */
    /* 1. Theme                                                           */
    /* ------------------------------------------------------------------ */

    function themeButtons() {
        return document.querySelectorAll('#theme-toggle, .theme-toggle, .nav-theme, #themeToggleBtn');
    }

    function currentTheme() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        var dark = theme === 'dark';
        root.setAttribute('data-theme', dark ? 'dark' : 'light');
        themeButtons().forEach(function (button) {
            button.setAttribute('aria-pressed', dark ? 'true' : 'false');
            button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
            button.setAttribute('title', dark ? 'Switch to light theme' : 'Switch to dark theme');
        });
    }

    function toggleTheme() {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(THEME_KEY, next); } catch (error) { /* storage unavailable */ }
        applyTheme(next);
    }

    function initTheme() {
        applyTheme(currentTheme());
        themeButtons().forEach(function (button) {
            button.addEventListener('click', toggleTheme);
        });
        // Follow the operating system while the visitor has not chosen a theme.
        var onSystemChange = function (event) {
            var saved = null;
            try { saved = localStorage.getItem(THEME_KEY); } catch (error) { /* ignore */ }
            if (!saved) { applyTheme(event.matches ? 'dark' : 'light'); }
        };
        var schemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (typeof schemeQuery.addEventListener === 'function') {
            schemeQuery.addEventListener('change', onSystemChange);
        }
    }

    /* ------------------------------------------------------------------ */
    /* 2. Mobile navigation                                               */
    /* ------------------------------------------------------------------ */

    function initMobileNav() {
        var toggle = document.getElementById('menu-toggle');
        var nav = document.getElementById('mobile-nav');
        if (!toggle || !nav) { return; }

        function setOpen(open) {
            nav.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
            document.body.classList.toggle('is-menu-open', open);
        }

        toggle.addEventListener('click', function () {
            setOpen(!nav.classList.contains('is-open'));
        });

        nav.addEventListener('click', function (event) {
            if (event.target.closest('a')) { setOpen(false); }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && nav.classList.contains('is-open')) {
                setOpen(false);
                toggle.focus();
            }
        });

        document.addEventListener('click', function (event) {
            if (!nav.classList.contains('is-open')) { return; }
            if (!event.target.closest('.site-header')) { setOpen(false); }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > 1000 && nav.classList.contains('is-open')) { setOpen(false); }
        });
    }

    // Kept so older inline handlers (onclick="toggleMobileMenu()") still work.
    window.toggleMobileMenu = function () {
        var nav = document.getElementById('mobile-nav');
        if (nav) { nav.classList.toggle('is-open'); }
    };

    /* ------------------------------------------------------------------ */
    /* 3–5. Header shadow, scroll progress, back to top                   */
    /* ------------------------------------------------------------------ */

    function initScrollUI() {
        var header = document.querySelector('.site-header');
        var progressBar = null;
        var pageIsLong = document.documentElement.scrollHeight > window.innerHeight * 1.8;

        if (pageIsLong && !reduceMotion.matches) {
            var progressWrap = document.createElement('div');
            progressWrap.className = 'scroll-progress';
            progressWrap.setAttribute('aria-hidden', 'true');
            progressBar = document.createElement('span');
            progressBar.className = 'scroll-progress-bar';
            progressWrap.appendChild(progressBar);
            document.body.appendChild(progressWrap);
        }

        var backToTop = document.createElement('button');
        backToTop.type = 'button';
        backToTop.className = 'back-to-top';
        backToTop.setAttribute('aria-label', 'Back to top');
        backToTop.innerHTML =
            '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>';
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
        });
        document.body.appendChild(backToTop);

        var ticking = false;

        function update() {
            var scrolled = window.scrollY || window.pageYOffset;
            var height = document.documentElement.scrollHeight - window.innerHeight;

            if (header) { header.classList.toggle('is-scrolled', scrolled > 4); }
            if (progressBar) {
                var ratio = height > 0 ? Math.min(scrolled / height, 1) : 0;
                progressBar.style.width = (ratio * 100).toFixed(2) + '%';
            }
            backToTop.classList.toggle('is-visible', scrolled > 700);
            ticking = false;
        }

        function onScroll() {
            if (!ticking) {
                ticking = true;
                window.requestAnimationFrame(update);
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        update();
    }

    /* ------------------------------------------------------------------ */
    /* 6. Reveal sections as they enter the viewport                      */
    /* ------------------------------------------------------------------ */

    function initReveal() {
        var targets = Array.prototype.slice.call(
            document.querySelectorAll('.main-content > section, .main-content > .prose')
        );
        if (!targets.length) { return; }
        if (reduceMotion.matches || !('IntersectionObserver' in window)) { return; }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

        function revealPassedSections() {
            var revealPoint = window.innerHeight * 0.94;
            targets.forEach(function (target) {
                if (target.classList.contains('is-visible')) { return; }
                if (target.getBoundingClientRect().top <= revealPoint) {
                    target.classList.add('is-visible');
                    observer.unobserve(target);
                }
            });
        }

        // Only animate below-the-fold content. The scroll fallback also reveals
        // sections already passed when a user jumps directly to an anchor or
        // presses End, so educational content can never be stranded faded out.
        targets.forEach(function (target) {
            if (target.getBoundingClientRect().top > window.innerHeight * 1.1) {
                target.classList.add('reveal');
                observer.observe(target);
            }
        });
        window.addEventListener('scroll', revealPassedSections, { passive: true });
        window.addEventListener('resize', revealPassedSections);
        revealPassedSections();
    }

    /* ------------------------------------------------------------------ */
    /* 7. Subtle cursor ring (desktop, fine-pointer devices only)         */
    /* ------------------------------------------------------------------ */

    function initCursor() {
        if (reduceMotion.matches || !finePointer.matches) { return; }

        var dot = document.createElement('div');
        var ring = document.createElement('div');
        dot.className = 'cursor-dot';
        ring.className = 'cursor-ring';
        dot.setAttribute('aria-hidden', 'true');
        ring.setAttribute('aria-hidden', 'true');
        document.body.appendChild(dot);
        document.body.appendChild(ring);

        var pointerX = -100;
        var pointerY = -100;
        var ringX = -100;
        var ringY = -100;
        var active = false;

        window.addEventListener('mousemove', function (event) {
            pointerX = event.clientX;
            pointerY = event.clientY;
            if (!active) {
                active = true;
                ringX = pointerX;
                ringY = pointerY;
                document.body.classList.add('cursor-active');
            }
            dot.style.transform = 'translate3d(' + pointerX + 'px,' + pointerY + 'px,0)';
        });

        document.addEventListener('mouseleave', function () {
            active = false;
            document.body.classList.remove('cursor-active');
        });

        document.addEventListener('mouseover', function (event) {
            var interactive = event.target.closest('a, button, summary, input, textarea, select, .quiz-option');
            ring.classList.toggle('is-hover', Boolean(interactive));
        });

        (function follow() {
            ringX += (pointerX - ringX) * 0.18;
            ringY += (pointerY - ringY) * 0.18;
            ring.style.transform = 'translate3d(' + ringX.toFixed(2) + 'px,' + ringY.toFixed(2) + 'px,0)';
            window.requestAnimationFrame(follow);
        }());
    }

    /* ------------------------------------------------------------------ */
    /* 8. Footer year                                                     */
    /* ------------------------------------------------------------------ */

    function initFooterYear() {
        var year = String(new Date().getFullYear());
        document.querySelectorAll('[data-current-year]').forEach(function (el) {
            el.textContent = year;
        });
    }

    /* ------------------------------------------------------------------ */
    /* 9. Generic checklists                                              */
    /*    Markup:  wrapper [data-checklist="NAME"] around checkboxes, with */
    /*    optional [data-check-count="NAME"] and [data-check-clear="NAME"]. */
    /*    State is stored in localStorage under selfpip-checklist-NAME.    */
    /* ------------------------------------------------------------------ */

    function initChecklist(wrap) {
        var name = wrap.getAttribute('data-checklist');
        if (!name) { return; }

        var boxes = wrap.querySelectorAll('input[type="checkbox"]');
        if (!boxes.length) { return; }

        var key = 'selfpip-checklist-' + name;
        var countEl = document.querySelector('[data-check-count="' + name + '"]');
        var clearEl = document.querySelector('[data-check-clear="' + name + '"]');
        var saved = [];

        try { saved = JSON.parse(localStorage.getItem(key)) || []; } catch (error) { saved = []; }

        boxes.forEach(function (box, index) {
            box.checked = saved[index] === true;
        });

        function refresh() {
            if (!countEl) { return; }
            var unchecked = 0;
            boxes.forEach(function (box) { if (!box.checked) { unchecked++; } });
            countEl.textContent = unchecked + ' unchecked';
        }

        function persist() {
            var state = [];
            boxes.forEach(function (box) { state.push(Boolean(box.checked)); });
            try { localStorage.setItem(key, JSON.stringify(state)); } catch (error) { /* private mode */ }
            refresh();
        }

        boxes.forEach(function (box) { box.addEventListener('change', persist); });

        if (clearEl) {
            clearEl.addEventListener('click', function () {
                boxes.forEach(function (box) { box.checked = false; });
                persist();
            });
        }

        refresh();
    }

    /* ------------------------------------------------------------------ */
    /* Boot                                                               */
    /* ------------------------------------------------------------------ */

    function boot() {
        initTheme();
        initMobileNav();
        initFooterYear();
        document.querySelectorAll('[data-checklist]').forEach(initChecklist);
        initScrollUI();
        initReveal();
        initCursor();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
}());
